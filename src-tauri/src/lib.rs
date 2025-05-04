// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::menu::{MenuBuilder, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

// 初始化数据库
fn init_db(app: &tauri::AppHandle) {
    // 确保数据目录存在
    let app_dir = app.path().app_data_dir().expect("无法获取app数据目录");
    std::fs::create_dir_all(&app_dir).expect("无法创建数据目录");

    // 打印数据库路径
    let db_path = app_dir.join("promptgenie.db");
    println!("数据库路径: {}", db_path.to_string_lossy());
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
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

            // 创建托盘菜单
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let tray_menu = MenuBuilder::new(app).items(&[&quit]).build()?;

            // 创建并配置系统托盘
            TrayIconBuilder::new()
                .icon(app.default_window_icon().expect("无法获取默认图标").clone())
                .menu(&tray_menu)
                .on_menu_event(|_app, event| {
                    if event.id().0 == "quit" {
                        std::process::exit(0);
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
