// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::{
    menu::{MenuBuilder, MenuItem},
    tray::{TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, Runtime,
};
use tauri_plugin_clipboard_manager;
use tauri_plugin_dialog;
use tauri_plugin_fs;
use tauri_plugin_sql::{Migration, MigrationKind};
use std::fs;

// 新增：模拟粘贴操作
#[cfg(target_os = "macos")]
use std::process::Command as ProcessCommand;

#[cfg(target_os = "windows")]
use std::process::Command as ProcessCommand;

#[cfg(target_os = "linux")]
use std::process::Command as ProcessCommand;

// 新增：用于从前端接收菜单项数据的结构体
#[derive(serde::Deserialize)]
struct PromptMenuItem {
    id: String,
    title: String,
}

// 初始化数据库
// fn init_db<R: Runtime>(app: &AppHandle<R>) {
//     // 确保数据目录存在
//     let app_dir = app.path().app_data_dir().expect("无法获取app数据目录");
//     std::fs::create_dir_all(&app_dir).expect("无法创建数据目录");

//     // 打印数据库路径
//     let db_path = app_dir.join("promptgenie.db");
//     println!("数据库路径: {}", db_path.to_string_lossy());
// }

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// 处理托盘图标事件的独立函数 - Simplified
fn handle_tray_icon_event<R: Runtime>(tray_handle: &TrayIcon<R>, event: TrayIconEvent) {
    match event {
        TrayIconEvent::Click { .. } => {
            // 点击时显示菜单而不是主窗口
            // 注意：我们不使用菜单，因为菜单已经通过 TrayIconBuilder 配置
            // 在 v2 中，单击会自动显示菜单（取决于操作系统设置）
        }
        TrayIconEvent::DoubleClick { .. } => {
            // 双击时显示主窗口
            if let Some(window) = tray_handle.app_handle().get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
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

    // 添加"显示主窗口"选项
    menu_builder = menu_builder.item(
        &MenuItem::with_id(&app_handle, "show-window", "显示主窗口", true, None::<&str>)
            .map_err(|e| e.to_string())?,
    );

    // 添加分隔线
    menu_builder = menu_builder.separator();

    // 添加最近提示词的标题（不可点击）
    menu_builder = menu_builder.item(
        &MenuItem::with_id(
            &app_handle,
            "recent-title",
            "最近使用的提示词",
            false, // 设为false表示不可点击
            None::<&str>,
        )
        .map_err(|e| e.to_string())?,
    );

    // 添加最近使用的提示词
    if items.is_empty() {
        menu_builder = menu_builder.item(
            &MenuItem::with_id(
                &app_handle,
                "no-recent",
                "  无记录", // 增加缩进以表示层级关系
                false,
                None::<&str>,
            )
            .map_err(|e| e.to_string())?,
        );
    } else {
        for item in items {
            let title = if item.title.chars().count() > 30 {
                format!("  {}...", item.title.chars().take(27).collect::<String>())
            // 增加缩进
            } else {
                format!("  {}", item.title) // 增加缩进
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

// 新增：模拟粘贴操作（Ctrl+V 或 Cmd+V）
#[tauri::command]
async fn simulate_paste() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use enigo::{Enigo, Key, KeyboardControllable};
        let mut enigo = Enigo::new();
        enigo.key_down(Key::Control);
        enigo.key_click(Key::Layout('v'));
        enigo.key_up(Key::Control);
    }

    #[cfg(target_os = "macos")]
    {
        // macOS 上使用 osascript 来模拟 Cmd+V
        let _ = ProcessCommand::new("osascript")
            .arg("-e")
            .arg("tell application \"System Events\" to keystroke \"v\" using command down")
            .output()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        use enigo::{Enigo, Key, KeyboardControllable};
        let mut enigo = Enigo::new();
        enigo.key_down(Key::Control);
        enigo.key_click(Key::Layout('v'));
        enigo.key_up(Key::Control);
    }

    Ok(())
}

// 新增：检查辅助功能权限状态
#[tauri::command]
async fn check_accessibility_permission() -> bool {
    #[cfg(target_os = "macos")]
    {
        // macOS 上使用 osascript 检查应用是否有辅助功能权限
        match ProcessCommand::new("osascript")
            .arg("-e")
            .arg("tell application \"System Events\" to keystroke \"\"")
            .output()
        {
            Ok(output) => output.status.success(),
            Err(_) => false,
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        // 其他平台暂时默认为已授权
        true
    }
}

// 新增：打开系统辅助功能设置
#[tauri::command]
async fn open_accessibility_settings() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        // macOS 上打开辅助功能设置页面
        let _ = ProcessCommand::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
            .output()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        // Windows 上打开相关设置页面
        let _ = ProcessCommand::new("cmd")
            .args(["/c", "start", "ms-settings:easeofaccess-keyboard"])
            .output()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        // Linux 上暂时没有标准方法
        return Err("在此平台上不支持自动打开系统设置".to_string());
    }

    Ok(())
}

// 新增：导出数据库到文件的命令
#[tauri::command]
async fn export_database_to_file<R: Runtime>(
    _app_handle: AppHandle<R>,
    file_path: String,
    export_data: String,
) -> Result<String, String> {
    match fs::write(&file_path, export_data) {
        Ok(_) => {
            println!("数据库导出成功: {}", file_path);
            Ok(file_path)
        }
        Err(e) => {
            eprintln!("数据库导出失败: {}", e);
            Err(format!("导出失败: {}", e))
        }
    }
}

// 新增：获取默认导出路径
#[tauri::command]
async fn get_default_export_path<R: Runtime>(app_handle: AppHandle<R>) -> Result<String, String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let timestamp = chrono::Local::now().format("%Y-%m-%d-%H-%M-%S");
    let file_name = format!("promptgenie-export-{}.json", timestamp);
    let export_path = app_dir.join(file_name);
    
    // 确保目录存在
    if let Some(parent) = export_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    
    Ok(export_path.to_string_lossy().to_string())
}

// 新增：安全退出命令（先导出再退出）
#[tauri::command]
async fn safe_quit<R: Runtime>(app_handle: AppHandle<R>) -> Result<(), String> {
    // 发送事件到前端，触发导出过程
    if let Some(window) = app_handle.get_webview_window("main") {
        match window.emit("before-quit", ()) {
            Ok(_) => {
                println!("已发送退出前导出事件");
                // 给前端一些时间处理导出，然后退出
                tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
            }
            Err(e) => {
                eprintln!("发送退出前导出事件失败: {}", e);
            }
        }
    }
    
    // 延迟退出以确保导出完成
    tokio::spawn(async {
        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
        std::process::exit(0);
    });
    
    Ok(())
}

// 定义插件入口函数
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create initial tables",
        sql: include_str!("../db/schema.sql"),
        kind: MigrationKind::Up,
    }];

    let builder = tauri::Builder::default()
        .setup(|app| {
            // Ensure the app data directory exists
            let app_dir = app.path().app_data_dir().expect("无法获取app数据目录");
            if !app_dir.exists() {
                std::fs::create_dir_all(&app_dir).expect("无法创建数据目录");
            }
            
            // 打印数据库路径以供调试
            let db_path = app_dir.join("promptgenie.db");
            println!("数据库路径: {}", db_path.to_string_lossy());
            
            Ok(())
        })
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            println!("单实例回调被触发！尝试聚焦现有窗口...");
            
            // 尝试获取主窗口 - 先尝试 "main"，然后尝试获取所有窗口
            if let Some(window) = app.get_webview_window("main") {
                println!("找到窗口 'main'，正在聚焦...");
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            } else {
                // 如果找不到 "main" 窗口，尝试获取第一个可用窗口
                println!("未找到窗口 'main'，尝试获取所有窗口...");
                let windows = app.webview_windows();
                if let Some((label, window)) = windows.iter().next() {
                    println!("找到窗口 '{}'，正在聚焦...", label);
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                } else {
                    println!("未找到任何窗口！");
                }
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations("sqlite:promptgenie.db", migrations)
                .build(),
        )
        .setup(|app| {
            // 初始化数据库目录（如果需要）
            // init_db(&app.handle());

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
                            // 修改为安全退出
                            let app_handle_clone = app_handle_for_event.clone();
                            tauri::async_runtime::spawn(async move {
                                if let Err(e) = safe_quit(app_handle_clone).await {
                                    eprintln!("安全退出失败: {}", e);
                                    std::process::exit(1);
                                }
                            });
                        }
                        "show-window" => {
                            // 显示主窗口
                            if let Some(window) = app_handle_for_event.get_webview_window("main") {
                                let _ = window.unminimize();
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "recent-title" | "no-recent" => {
                            // 这些是不可点击或无操作的菜单项
                        }
                        _ => {
                            println!("Clicked prompt menu item ID: {}", id);
                            // 处理提示词菜单项点击
                            if id.starts_with("no-") {
                                return; // 无操作项，如"无记录"
                            }

                            // 把 ID 作为 payload 发送到前端处理
                            let payload = id.to_string();

                            // 发送事件到前端，表示要将此提示词内容直接插入到当前输入框
                            if let Some(window) = app_handle_for_event.get_webview_window("main") {
                                match window.emit("paste-prompt-content", payload) {
                                    Ok(_) => {
                                        println!("已发送插入提示词内容事件");
                                    }
                                    Err(e) => {
                                        eprintln!("发送插入提示词内容事件失败: {}", e);
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
        .invoke_handler(tauri::generate_handler![
            greet,
            update_tray_menu,
            simulate_paste,
            check_accessibility_permission,
            open_accessibility_settings,
            export_database_to_file,
            get_default_export_path,
            safe_quit
        ]);

    // 构建应用实例
    let app = builder
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    // 使用run方法并处理窗口事件
    app.run(|app_handle, event| {
        match event {
            // 处理 close-requested 事件
            tauri::RunEvent::WindowEvent {
                label,
                event: tauri::WindowEvent::CloseRequested { api, .. },
                ..
            } => {
                if label == "main" {
                    // 获取窗口句柄
                    if let Some(window) = app_handle.get_webview_window("main") {
                        // 阻止窗口关闭
                        api.prevent_close();
                        // 隐藏窗口
                        let _ = window.hide();
                    }
                }
            }
            _ => {}
        }
    });
}
