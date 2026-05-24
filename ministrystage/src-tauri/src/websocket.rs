use futures_util::{SinkExt, StreamExt};
use std::sync::Arc;
use tauri::{command, AppHandle, State};
use tokio::net::TcpListener;
use tokio::sync::broadcast;
use tokio_tungstenite::accept_async;

pub struct WsState {
    pub tx: broadcast::Sender<String>,
}

pub async fn start_websocket_server(tx: broadcast::Sender<String>) {
    let addr = "0.0.0.0:8080";
    let listener = TcpListener::bind(&addr)
        .await
        .expect("Can't bind WebSocket server to port 8080");

    while let Ok((stream, _)) = listener.accept().await {
        let tx = tx.clone();
        let mut rx = tx.subscribe();

        tokio::spawn(async move {
            if let Ok(mut ws_stream) = accept_async(stream).await {
                loop {
                    tokio::select! {
                        Ok(msg) = rx.recv() => {
                            if ws_stream.send(tokio_tungstenite::tungstenite::Message::Text(msg)).await.is_err() {
                                break;
                            }
                        }
                        Some(Ok(msg)) = ws_stream.next() => {
                            if msg.is_text() {
                                let _ = tx.send(msg.to_text().unwrap().to_string());
                            }
                        }
                    }
                }
            }
        });
    }
}

#[command]
pub fn send_ws_message(state: State<'_, WsState>, message: String) -> Result<(), String> {
    state.tx.send(message).map_err(|e| e.to_string())?;
    Ok(())
}
