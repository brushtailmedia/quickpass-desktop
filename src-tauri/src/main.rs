#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::RunEvent;
use tauri_plugin_clipboard_manager::ClipboardExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            // Like the original Tkinter app: closing QuickPass (window close or Cmd+Q)
            // clears the clipboard so a copied password does not outlive the app.
            if let RunEvent::ExitRequested { .. } = event {
                let _ = app.clipboard().clear();
            }
        });
}
