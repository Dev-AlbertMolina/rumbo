import { it } from "vitest";
import { contrast, cvdDistance, normalDistance } from "./palette";
it("barra 2 del grafico", () => {
  for (const candidato of ["#9a5700", "#b07c05", "#6b2948", "#0f9c6e", "#1f5fa0"]) {
    console.log(
      "barra2", candidato,
      "contraste", contrast(candidato, "#fff8f0").toFixed(2),
      "| vs terracota normal", normalDistance(candidato, "#a94725").toFixed(1),
      "deut", cvdDistance(candidato, "#a94725", "deuteranopia").toFixed(1)
    );
  }
});
