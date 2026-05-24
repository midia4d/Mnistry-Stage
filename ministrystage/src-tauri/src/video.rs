use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::{command, AppHandle, State};

pub struct VideoState {
    pub process: Mutex<Option<Child>>,
}

#[command]
pub fn play_video(state: State<'_, VideoState>, path: String) -> Result<(), String> {
    let mut process_guard = state.process.lock().unwrap();

    // Stop any existing video
    if let Some(mut child) = process_guard.take() {
        let _ = child.kill();
    }

    // Start mpv as a subprocess
    // In a real app, you might use --input-ipc-server for advanced control
    let child = Command::new("mpv")
        .arg("--fs")
        .arg("--ontop")
        .arg(path)
        .spawn()
        .map_err(|e| e.to_string())?;

    *process_guard = Some(child);
    Ok(())
}

#[command]
pub fn stop_video(state: State<'_, VideoState>) -> Result<(), String> {
    let mut process_guard = state.process.lock().unwrap();
    if let Some(mut child) = process_guard.take() {
        let _ = child.kill();
    }
    Ok(())
}
