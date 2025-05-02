// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
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
        description: "create_initial_tables",
        sql: include_str!("../db/schema.sql"), // 直接包含 schema 文件内容
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
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
