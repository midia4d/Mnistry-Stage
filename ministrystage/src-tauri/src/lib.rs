mod config;
mod video;
mod websocket;

use std::sync::Mutex;
use tokio::sync::broadcast;
use video::VideoState;
use websocket::WsState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let (tx, _rx) = broadcast::channel(100);
    let tx_clone = tx.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(VideoState {
            process: Mutex::new(None),
        })
        .manage(WsState { tx })
        .setup(|_app| {
            tauri::async_runtime::spawn(async move {
                websocket::start_websocket_server(tx_clone).await;
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            video::play_video,
            video::stop_video,
            websocket::send_ws_message
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
