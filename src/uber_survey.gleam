
import gleam/io
import gleam/json
import gleam/http://http

// FFI for SQLite and Bun Server
pub external fn save_to_db(data: String) -> Bool
pub external fn get_all_responses() -> String

pub fn main() {
  io.println("Uber Survey Backend initialized.")
  io.println("Use 'bun run index.ts' to start the server.")
}
