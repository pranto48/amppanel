import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { time: "00:00", cpu: 25, ram: 45, network: 10 },
  { time: "04:00", cpu: 15, ram: 42, network: 8 },
  { time: "08:00", cpu: 45, ram: 55, network: 25 },
  { time: "12:00", cpu: 65, ram: 62, network: 45 },
  { time: "16:00", cpu: 55, ram: 58, network: 38 },
  { time: "20:00", cpu: 35, ram: 48, network: 20 },
  { time: "Now", cpu: 42, ram: 52, network: 28 },
];

export const ResourceChart = () => {
  return (
    <div className="glass-card rounded-xl p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-foreground">Resource Usage (24h)</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">CPU</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-xs text-muted-foreground">RAM</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-info" />
            <span className="text-xs text-muted-foreground">Network</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(187, 85%, 53%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(187, 85%, 53%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="networkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 15%)" />
            <XAxis 
              dataKey="time" 
              stroke="hsl(215, 20%, 55%)" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(215, 20%, 55%)" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(222, 47%, 10%)",
                border: "1px solid hsl(222, 47%, 15%)",
                borderRadius: "8px",
                boxShadow: "0 4px 20px -4px rgba(0,0,0,0.5)",
              }}
              labelStyle={{ color: "hsl(210, 40%, 98%)" }}
              itemStyle={{ color: "hsl(215, 20%, 55%)" }}
            />
            <Area 
              type="monotone" 
              dataKey="cpu" 
              stroke="hsl(187, 85%, 53%)" 
              strokeWidth={2}
              fill="url(#cpuGradient)" 
            />
            <Area 
              type="monotone" 
              dataKey="ram" 
              stroke="hsl(142, 76%, 36%)" 
              strokeWidth={2}
              fill="url(#ramGradient)" 
            />
            <Area 
              type="monotone" 
              dataKey="network" 
              stroke="hsl(199, 89%, 48%)" 
              strokeWidth={2}
              fill="url(#networkGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
