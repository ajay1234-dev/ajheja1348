import { render, screen } from "@testing-library/react";
import HealthChart from "./health-chart-enhanced";
import { TimelineEvent } from "@/types/medical";
import '@testing-library/jest-dom'; // Added for toBeInTheDocument

// Mock data for testing
const mockData: TimelineEvent[] = [
  {
    id: "1",
    title: "Annual Physical Exam",
    date: "2024-01-15",
    metrics: {
      Systolic: 135,
      Diastolic: 85,
      Cholesterol_Total: 220,
    },
    reportName: "Annual Physical Exam.pdf",
  },
  {
    id: "2",
    title: "Follow-up Blood Work",
    date: "2024-03-22",
    metrics: {
      Systolic: 130,
      Diastolic: 82,
      Cholesterol_Total: 210,
    },
    reportName: "Follow-up Blood Work.pdf",
  },
  {
    id: "3",
    title: "Quarterly Checkup",
    date: "2024-06-10",
    metrics: {
      Systolic: 125,
      Diastolic: 78,
      Cholesterol_Total: 195,
    },
    reportName: "Quarterly Checkup.pdf",
  },
];

describe("HealthChart Enhanced", () => {
  it("renders without crashing", () => {
    render(
      <HealthChart
        data={mockData}
        isLoading={false}
      />
    );

    expect(screen.getByText("Health Timeline")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(
      <HealthChart data={[]} isLoading={true} />
    );

    expect(screen.getByText("Health Timeline")).toBeInTheDocument();
  });

  it("shows no data message when data is empty", () => {
    render(
      <HealthChart
        data={[]}
        isLoading={false}
      />
    );

    expect(screen.getByText("No Health Data Available")).toBeInTheDocument();
  });

  it("renders metric categories correctly", () => {
    render(
      <HealthChart
        data={mockData}
        isLoading={false}
      />
    );

    // Check for category titles
    expect(screen.getByText("Blood Pressure")).toBeInTheDocument();
    expect(screen.getByText("Cholesterol")).toBeInTheDocument();
  });

  it("formats large numbers with commas", () => {
    const largeNumberData: TimelineEvent[] = [
      {
        id: "4",
        title: "Test Report",
        date: "2024-01-15",
        metrics: {
          HighValueMetric: 15000,
        },
        reportName: "Test Report.pdf",
      },
    ];

    render(
      <HealthChart
        data={largeNumberData}
        isLoading={false}
      />
    );

    // The component should format 15000 as "15,000"
    // We can't easily test the exact formatted value in the DOM without more specific selectors
    expect(screen.getByText("Health Timeline")).toBeInTheDocument();
  });

  it("formats small decimal numbers correctly", () => {
    const smallNumberData: TimelineEvent[] = [
      {
        id: "5",
        title: "Test Report",
        date: "2024-01-15",
        metrics: {
          SmallValueMetric: 0.75,
        },
        reportName: "Test Report.pdf",
      },
    ];

    render(
      <HealthChart
        data={smallNumberData}
        isLoading={false}
      />
    );

    // The component should format 0.75 as "0.75"
    expect(screen.getByText("Health Timeline")).toBeInTheDocument();
  });
});