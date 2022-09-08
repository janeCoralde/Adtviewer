import { FrontstageManager, StagePanelState } from "@itwin/appui-react";
import TsiClient from "tsiclient";
import { AzureAuth } from "../../AzureToken"

const EnvironmentFqdn = "097c08c6-8afd-486e-bea9-2b7978cb4091.env.timeseries.azure.com";

export class TimeSeries {

  public static AllNodes = ["66-TT-301"];
  public static liveMode = false;
  private static tsiClient = new TsiClient();
  private static lineChart: any = null;
  private static pollData: any;
  private static lastCallContext: any = {};
  private static latestRequestId: string;

  public static switchToLiveMode() {
    TimeSeries.liveMode = true;

    this.loadDataForNodes(
        this.lastCallContext["title"],
        this.lastCallContext["dtIds"], 
        this.lastCallContext["properties"], 
        this.lastCallContext["nameByDtId"], 
        this.lastCallContext["includeEnvelope"])
  }

  public static switchToNormalMode() {
    TimeSeries.liveMode = false;

    this.loadDataForNodes(
        this.lastCallContext["title"],
        this.lastCallContext["dtIds"], 
        this.lastCallContext["properties"], 
        this.lastCallContext["nameByDtId"], 
        this.lastCallContext["includeEnvelope"])
  }

  public static showTsiGraph() {
      FrontstageManager.activeFrontstageDef!.bottomPanel!.panelState = StagePanelState.Open;
  }


  public static async loadDataForNodes(title: string, dtIds: string[], properties: string[], nameByDtId = false, includeEnvelope = true ) {
    this.lastCallContext["title"] = title;
    this.lastCallContext["dtIds"] = dtIds;
    this.lastCallContext["properties"] = properties;
    this.lastCallContext["nameByDtId"] = nameByDtId;
    this.lastCallContext["includeEnvelope"] = includeEnvelope;
    
    clearInterval(this.pollData);
    this._loadData(title, dtIds, properties, nameByDtId, includeEnvelope);

    if(this.liveMode) {
      this.pollData = setInterval(() => {
        if(this.liveMode) this._loadData(title, dtIds, properties, nameByDtId, includeEnvelope);
      }, 1000);
    }
  }

  // loading TSI chart by querying TSI instance.
  private static async _loadData(title: string, dtIds: string[], properties: string[], nameByDtId = false, includeEnvelope = true ) {
    const tsiToken = await AzureAuth.getTsiToken();

    if (!tsiToken) return;
    
    const linechartTsqExpressions: any[] = [];
    let searchSpan;
    const now = new Date();
    
    if (this.liveMode)
      searchSpan = { from: now.valueOf() - (0.25*60*60*1000), to: now }
    else
      searchSpan = { from: now.valueOf() - (2*60*60*1000), to: now, bucketSize: '10m' }

    for (const dtId of dtIds) {
      for (const property of properties) {
        linechartTsqExpressions.push(new this.tsiClient.ux.TsqExpression(
          {timeSeriesId: [dtId, "/" + property] },
          {avg: {
              kind: 'numeric',
              value: {tsx: 'coalesce($event.patch.value.Double, todouble($event.patch.value.Long))'},
              filter: null,
              aggregation: {tsx: 'avg($value)'}
          },
          min: {
            kind: 'numeric',
            value: {tsx: 'coalesce($event.patch.value.Double, todouble($event.patch.value.Long))'},
            filter: null,
            aggregation: {tsx: 'min($value)'}
          },
          max: {
            kind: 'numeric',
            value: {tsx: 'coalesce($event.patch.value.Double, todouble($event.patch.value.Long))'},
            filter: null,
            aggregation: {tsx: 'max($value)'}
          }},
          searchSpan,
          {includeEnvelope: includeEnvelope, alias: nameByDtId ? dtId : property }
          ));
      }
    }
    
    const liveMode = this.liveMode;

    // hack to force TSI graph update to only the latest call
    const requestGuid = this.generateGuid();
    this.latestRequestId = requestGuid;
  
    const result: any = await this.tsiClient.server.getTsqResults(tsiToken, EnvironmentFqdn, linechartTsqExpressions.map(function(ae){return liveMode ? ae.toTsq(false, false, true) : ae.toTsq()}));
    if (result[0] && (this.latestRequestId == requestGuid)) this.updateTsiGraph(result, title, linechartTsqExpressions, null, -300, 'shared', liveMode);
  }

  public static updateTsiGraph(result: any, title: string, linechartTsqExpressions?: any, chartDataOptions?: any, timeOffset: number = 0, yAxisState = 'overlap', noAnimate = true) {
    var transformedResult = !linechartTsqExpressions ? result : this.tsiClient.ux.transformTsqResultsForVisualization(result, linechartTsqExpressions);
    let customOptions = chartDataOptions ? chartDataOptions : linechartTsqExpressions;
    
    (window as any).setTsiTitle(title);

    const diagram = document.getElementById('diagramDIV');
    if (diagram) {
      this.lineChart = !this.lineChart ? new this.tsiClient.ux.LineChart(diagram) : this.lineChart;
      this.lineChart.render(transformedResult, {yAxisState, theme: 'light', legend: 'compact',  grid: true, tooltip: true, offset: timeOffset, noAnimate}, customOptions);
    }
  }

  private static generateGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
}
