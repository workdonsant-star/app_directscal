import { BarChart, HeatmapChart, ScatterChart } from "echarts/charts";
import {
  AriaComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { LabelLayout } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  AriaComponent,
  BarChart,
  CanvasRenderer,
  GraphicComponent,
  GridComponent,
  HeatmapChart,
  LabelLayout,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  ScatterChart,
  TooltipComponent,
  VisualMapComponent,
]);

export { echarts };
