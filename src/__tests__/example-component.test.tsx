import { Button } from "@/components/ui/button";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useQuery } from "convex/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

const mockedUseQuery = vi.mocked(useQuery);

function ConvexStatus() {
  const status = useQuery("example/status" as never) as string | undefined;
  return <p>{status ?? "Loading…"}</p>;
}

function CounterButton() {
  const [count, setCount] = useState(0);
  return (
    <Button
      onClick={() => setCount((current) => current + 1)}
    >{`Count: ${count}`}</Button>
  );
}

describe("example component patterns", () => {
  it("renders mocked Convex data", () => {
    mockedUseQuery.mockReturnValue("Connected");

    render(<ConvexStatus />);

    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(mockedUseQuery).toHaveBeenCalledTimes(1);
  });

  it("updates UI after a user interaction", async () => {
    const user = userEvent.setup();

    render(<CounterButton />);

    await user.click(screen.getByRole("button", { name: "Count: 0" }));
    expect(
      screen.getByRole("button", { name: "Count: 1" }),
    ).toBeInTheDocument();
  });
});
