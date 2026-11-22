
"use client";

import { useEffect, useState } from "react";
import { Snowfall } from '@namnguyenthanhwork/react-snowfall-effect';

export default function SeasonalSnowfall() {
  const [isHolidaySeason, setIsHolidaySeason] = useState(false);

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();

    const seasonStart = new Date(year, 10, 1);
    const seasonEnd = new Date(year + 1, 0, 1);

    setIsHolidaySeason(
      now >= seasonStart && now < seasonEnd
    );
  }, []);

  if (!isHolidaySeason) return null;

  return (
      <Snowfall
        snowflakeShape="dot"
        snowflakeCount={60}
        wind={{ min: -0.8, max: 0.8 }}
        followMouse={false}
        gravity={0.4}
        fadeEdges={true}
      />
  );
}
