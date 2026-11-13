import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

beforeEach(() => localStorage.clear());

describe("App", () => {
  it("toggles a habit for today and persists it", () => {
    render(<App />);
    const btn = screen.getByRole("button", { name: /Marcar Beber 2 L de água/ });
    fireEvent.click(btn);
    expect(screen.getByRole("button", { name: /Desmarcar Beber 2 L de água/ })).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("habitflow:v1")).toContain(new Date().toISOString().slice(0, 4));
  });

  it("shows stats tab", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Estatísticas" }));
    expect(await screen.findByRole("heading", { name: "Por dia da semana" })).toBeInTheDocument();
  });
});
