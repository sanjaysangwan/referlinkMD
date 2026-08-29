"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#1B6B63", "#C45C4A", "#B8893D", "#2A4D7A", "#2F7D4A", "#6B4F3A"];

const tooltipStyle = {
  background: "#fffcf8",
  border: "1px solid #d7cfc3",
  borderRadius: 12,
  fontSize: 12,
};

export function TrendChart({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#e7dfd3" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#3d5164", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: "#3d5164", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="count" stroke="#1B6B63" strokeWidth={2.4} dot={false} name="Referrals" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarsChart({
  data,
  nameKey = "name",
}: {
  data: { name?: string; label?: string; count: number }[];
  nameKey?: string;
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={28}>
          <CartesianGrid stroke="#e7dfd3" vertical={false} />
          <XAxis dataKey={nameKey} tick={{ fill: "#3d5164", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: "#3d5164", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" fill="#1B6B63" radius={[8, 8, 0, 0]} name="Referrals" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChart({
  data,
}: {
  data: { name: string; count: number }[];
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={3}>
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
