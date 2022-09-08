import { XAndY, XYAndZ } from "@itwin/core-geometry";
import { BeButtonEvent, IModelApp, Marker, NotifyMessageDetails, OutputMessagePriority, StandardViewId } from "@itwin/core-frontend";
import { AdtDataLink } from "../../AdtDataLink";
import { TimeSeries } from "../time-series/TimeSeries";


export class SmartDeviceMarker extends Marker {
    private _smartDeviceType: string;
    private _smartDeviceId: string;
    private _elementId: string;
    
    constructor(location: XYAndZ, size: XAndY, smartDeviceId: string, elementId: string) {
        super(location, size);
        this._smartDeviceId = smartDeviceId;
        this._smartDeviceType = "66-TT-301";
        this._elementId = elementId;
        this.setImageUrl(`/${this._smartDeviceType}.png`);
   }

   public onMouseButton(_ev: BeButtonEvent): boolean {
    //if (!_ev.isDown) return true;

    //IModelApp.notifications.outputMessage(new NotifyMessageDetails(OutputMessagePriority.Info, "Element " + this._smartDeviceId + " was clicked on"));
    AdtDataLink.fetchTemp("66-TT-301");
    IModelApp.viewManager.selectedView!.zoomToElements(this._elementId, { animateFrustumChange: true, standardViewId: StandardViewId.RightIso });
    
    //TtimeSeries
    const id = "66-TT-301"
    TimeSeries.loadDataForNodes(id, [id], ["temperature"]);
    if (_ev.isDoubleClick) TimeSeries.showTsiGraph();
    return true;
  } 
} 

 