// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::{
    menu::{MenuBuilder, MenuItem},
    tray::{TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, Runtime,
};
use tauri_plugin_sql::{Migration, MigrationKind};

// 新增：用于从前端接收菜单项数据的结构体
#[derive(serde::Deserialize)]
struct PromptMenuItem {
    id: String,
    title: String,
}

// 初始化数据库
fn init_db<R: Runtime>(app: &AppHandle<R>) {
    // 确保数据目录存在
    let app_dir = app.path().app_data_dir().expect("无法获取app数据目录");
    std::fs::create_dir_all(&app_dir).expect("无法创建数据目录");

    // 打印数据库路径
    let db_path = app_dir.join("promptgenie.db");
    println!("数据库路径: {}", db_path.to_string_lossy());
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You\'ve been greeted from Rust!", name)
}

// 处理托盘图标事件的独立函数 - Simplified
fn handle_tray_icon_event<R: Runtime>(tray_handle: &TrayIcon<R>, event: TrayIconEvent) {
    match event {
        TrayIconEvent::Click { .. } => {
            if let Some(window) = tray_handle.app_handle().get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            } else {
                eprintln!("无法找到主窗口 'main'");
            }
        }
        _ => {}
    }
}

// 新增：用于更新托盘菜单的命令
#[tauri::command]
async fn update_tray_menu<R: Runtime>(
    app_handle: AppHandle<R>,
    items: Vec<PromptMenuItem>,
) -> Result<(), String> {
    // 构建菜单
    let mut menu_builder = MenuBuilder::new(&app_handle);

    if items.is_empty() {
        menu_builder = menu_builder.item(
            &MenuItem::with_id(
                &app_handle,
                "no-recent",
                "无最近使用记录",
                false,
                None::<&str>,
            )
            .map_err(|e| e.to_string())?,
        );
    } else {
        for item in items {
            let title = if item.title.chars().count() > 30 {
                format!("{}...", item.title.chars().take(27).collect::<String>())
            } else {
                item.title
            };
            menu_builder = menu_builder.item(
                &MenuItem::with_id(&app_handle, &item.id, title, true, None::<&str>)
                    .map_err(|e| e.to_string())?,
            );
        }
    }

    let menu = menu_builder
        .separator()
        .item(
            &MenuItem::with_id(&app_handle, "quit", "退出", true, None::<&str>)
                .map_err(|e| e.to_string())?,
        )
        .build()
        .map_err(|e| e.to_string())?;

    // 获取现有托盘图标并更新菜单，而不是创建新图标
    if let Some(tray_icon) = app_handle.tray_by_id("default") {
        tray_icon.set_menu(Some(menu)).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        // 如果找不到默认托盘图标，打印信息并返回错误
        eprintln!("找不到默认托盘图标");
        Err("找不到默认托盘图标".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create initial tables",
        sql: include_str!("../db/schema.sql"),
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations("sqlite:promptgenie.db", migrations)
                .build(),
        )
        .setup(|app| {
            // 初始化数据库目录（如果需要）
            init_db(&app.handle());

            // --- 托盘初始设置 ---
            let app_handle = app.handle().clone();

            // 初始菜单可以保持简单，只包含退出选项
            let initial_menu = MenuBuilder::new(&app_handle)
                .item(&MenuItem::with_id(
                    &app_handle,
                    "quit",
                    "退出",
                    true,
                    None::<&str>,
                )?)
                .build()?;

            let icon = app_handle
                .default_window_icon()
                .expect("无法获取默认图标")
                .clone();

            // 构建托盘图标并设置 ID
            TrayIconBuilder::with_id("default")
                .icon(icon)
                .tooltip("PromptGenie")
                .menu(&initial_menu)
                .on_menu_event(move |app_handle_for_event, event| {
                    let id = event.id().0.as_str();
                    match id {
                        "quit" => {
                            std::process::exit(0);
                        }
                        _ => {
                            println!("Clicked dynamic menu item ID: {}", id);
                            let payload = id.to_string();

                            // 使用主窗口直接发送事件
                            if let Some(window) = app_handle_for_event.get_webview_window("main") {
                                match window.emit("tray-prompt-selected", payload) {
                                    Ok(_) => {}
                                    Err(e) => {
                                        eprintln!("Failed to emit tray-prompt-selected: {}", e)
                                    }
                                }
                            }
                        }
                    }
                })
                .on_tray_icon_event(handle_tray_icon_event)
                .build(&app_handle)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, update_tray_menu])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
