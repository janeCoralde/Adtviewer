import { QueryRowFormat } from "@itwin/core-common";
import { DecorateContext, Decorator, IModelConnection, Marker, ScreenViewport } from "@itwin/core-frontend";
import { SmartDeviceMarker } from "../markers/SmartDeviceMarker";

export class SmartDeviceDecorator implements Decorator{
    private _iModel: IModelConnection;
    private _markerSet: Marker[];

    constructor(vp: ScreenViewport) {
        this._iModel = vp.iModel;
        this._markerSet = [];

        this.addMarkers();
      }

    private async getSmartDeviceData() {
        const query = `
            SELECT ECInstanceId,
                    Origin,
                    userLabel 
                    FROM Nwddynamic.Nwdcomponent WHERE UserLabel='SLCYLINDER 1 of EQUIPMENT /66-TT-301'
            `
    
        const results = this._iModel.query(query, undefined, {rowFormat: QueryRowFormat.UseJsPropertyNames});
        const values = [];

        for await(const row of results)
            values.push(row);
        
        return values;
    }

    public async addMarkers() {
        const values = await this.getSmartDeviceData();

        values.forEach(value => {
            const smartDeviceMarker = new SmartDeviceMarker(
                { x: value.origin.x, y: value.origin.y, z: value.origin.z },
                { x: 65, y: 40 },
                value.userLabel,
                value.id
            );

            this._markerSet.push(smartDeviceMarker);
        })
    }

    public decorate(context: DecorateContext): void {
        this._markerSet.forEach(marker => {
            marker.addDecoration(context);
        })
    }
}