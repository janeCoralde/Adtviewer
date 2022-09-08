import { AzureAuth } from "./AzureToken";
import { IModelApp, NotifyMessageDetails, OutputMessagePriority } from "@itwin/core-frontend";


export class AdtDataLink {

  // changed the adthost
  // public static adtHost = "windfarm-iot.api.wcus.digitaltwins.azure.net";
  public static adtHost = "digitaltwin-itwin-dt.api.wcus.digitaltwins.azure.net";   // original value

  public static async fetchDataForNode(dtId: string) {
  const adtToken = await AzureAuth.getAdtToken();
    
    //console.warn("AdtDataLink --> fetched token and manually input not the same");
    //console.log("FetchDataForNode: azureToken --> " + adtToken);
    //console.log("FetchDataForNode: manually input --> " + adtTokenn);
    
    const request = `http://localhost:3000/digitaltwins/${dtId}?api-version=2020-10-31`;

    const response = adtToken ? await fetch(request, { 
      headers: { 
        //Authorization: "Bearer " + await AzureAuth.getAdtToken(), Host: AdtDataLink.adtHost 
        Authorization: "Bearer " + adtToken, Host: AdtDataLink.adtHost
      } 
      }).then(response =>
        response.json().then(data => ({
          data: data,
          status: response.status
        })).then(res => {
          //console.log("ID " +res.data.id);
          //console.log("temperature " +res.data.temperature);
          const deviceID = res.data.id;
          const deviceLastUpdated = res.data.$metadata.temperature.lastUpdateTime;
          const deviceData = res.data.temperature;

          var now = new Date();

          console.log(now.toUTCString() + "\nID: " + deviceID + "\nTemperature: " + deviceData + " (last Updated:" + deviceLastUpdated + ")");
          return deviceData;
        })
      ) : null;

      return;
    //return response ? response.json() : null;
  }

  public static async fetchTemp(dtId: string) {

    const adtToken = await AzureAuth.getAdtToken();
    const request = `http://localhost:3000/digitaltwins/${dtId}?api-version=2020-10-31`;
    const response = adtToken ? await fetch(request, { 
      headers: { 
        Authorization: "Bearer " + adtToken, Host: AdtDataLink.adtHost
      }}
      ).then(response =>
        response.json().then(data => ({
          data: data,
          status: response.status
        })).then(res => {
          const deviceData = res.data.temperature;
          IModelApp.notifications.outputMessage(new NotifyMessageDetails(OutputMessagePriority.Info, "66-TT-301's temp is " + deviceData +" C"));
        })
      ) : null;

    return response ? response : null;
  }
}
