const steps = [
  "pending",
  "confirmed",
  "technician_assigned",
  "completed",
];

export default function BookingTimeline({ status }) {
  return (
    <div className="flex items-center gap-4 mt-4">
      {steps.map((step, index) => {
        const active = steps.indexOf(status) >= index;

        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full ${
                active ? "bg-green-500" : "bg-gray-300"
              }`}
            />
            <span className="text-xs capitalize">
              {step.replace("_", " ")}
            </span>
            {index !== steps.length - 1 && (
              <div className="w-8 h-[2px] bg-gray-300" />
            )}
          </div>
        );
      })}
    </div>
  );
}
