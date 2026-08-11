import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import eraserImageUrl from "../../assets/home-tools/eraser.png";
import pencilImageUrl from "../../assets/home-tools/pencil.png";
import { HomeDrawingTools } from "./HomeDrawingTools";

function pngDimensions(path: string) {
  const image = readFileSync(path);
  return {
    width: image.readUInt32BE(16),
    height: image.readUInt32BE(20)
  };
}

describe("HomeDrawingTools", () => {
  it("uses the losslessly cropped PNG tools and exposes resting tools for pickup", () => {
    const onPickTool = vi.fn();
    render(
      <HomeDrawingTools
        onPickTool={onPickTool}
        onToolImageLoad={vi.fn()}
        phases={{ eraser: "resting", pencil: "resting" }}
        registerToolElement={vi.fn()}
      />
    );

    const pencilButton = screen.getByRole("button", { name: "鉛筆を拾う" });
    const eraserButton = screen.getByRole("button", { name: "消しゴムを拾う" });
    const pencilImage = pencilButton.querySelector("img");
    const eraserImage = eraserButton.querySelector("img");

    expect(pencilButton.querySelector("svg")).not.toBeInTheDocument();
    expect(eraserButton.querySelector("svg")).not.toBeInTheDocument();
    expect(pencilImage).toHaveAttribute("src", pencilImageUrl);
    expect(pencilImage).toHaveAttribute("width", "289");
    expect(pencilImage).toHaveAttribute("height", "606");
    expect(pencilImage).toHaveAttribute("draggable", "false");
    expect(eraserImage).toHaveAttribute("src", eraserImageUrl);
    expect(eraserImage).toHaveAttribute("width", "181");
    expect(eraserImage).toHaveAttribute("height", "230");
    expect(eraserImage).toHaveAttribute("draggable", "false");

    fireEvent.pointerUp(pencilButton, {
      clientX: 40,
      clientY: 60,
      pointerId: 1,
      pointerType: "mouse"
    });
    expect(onPickTool).toHaveBeenCalledWith("pencil", { x: 40, y: 60 });
  });

  it("keeps the cropped PNG files at their exact source dimensions", () => {
    expect(pngDimensions("src/assets/home-tools/pencil.png")).toEqual({ width: 289, height: 606 });
    expect(pngDimensions("src/assets/home-tools/eraser.png")).toEqual({ width: 181, height: 230 });
  });
});
