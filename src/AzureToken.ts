//import * as Msal from "@azure/msal-browser";
import * as Msal from "msal";

const AdtAppId = "0b07f429-9f4b-4714-9392-cc5e8e80c8b0";
const TsiAppId = "097c08c6-8afd-486e-bea9-2b7978cb4091";    
const ClientId = "47d660ce-9468-4d2b-b31d-9d4383a43a43";
const TenantId = "8d0d81ba-ed03-4c6f-9248-a3b3967ca35c";    

export class AzureAuth {

  private static msalConfig = {
    auth: {
      clientId: ClientId,
      redirectUri: "http://localhost:3000",
      authority: "https://login.microsoftonline.com/" + TenantId
    }
  };

  public static async initialize() {
    const loginRequest = {
      //scopes: ["https://api.timeseries.azure.com//user_impersonation"] // optional Array<string>
      scopes: ["User.Read"]
    };
    const msalInstance = new Msal.UserAgentApplication(AzureAuth.msalConfig);

    await msalInstance.loginPopup(loginRequest);
  }

  public static async getAdtToken() {
    return this.fetchToken([AdtAppId + "/.default"]);
  }

  public static async getTsiToken() {
    return this.fetchToken([TsiAppId + "/.default"]);
  }

  private static async fetchToken(scopes: any) {
    const msalInstance = new Msal.UserAgentApplication(AzureAuth.msalConfig);
    if (msalInstance.getLoginInProgress())
      return;
    
    msalInstance.handleRedirectCallback((_error: any, _response: any) => {
      // handle redirect response or error
    });

    try {
      let accessToken: any;
      // if the user is already logged in you can acquire a token
    if (msalInstance.getAccount()) {
        var tokenRequest = {
            scopes: ["user.read", "mail.send"]
        };
        msalInstance.acquireTokenSilent(tokenRequest)
            .then(response => {
                // get access token from response
                // response.accessToken
            })
            .catch(err => {
                // could also check if err instance of InteractionRequiredAuthError if you can import the class.
                if (err.name === "InteractionRequiredAuthError") {
                    return msalInstance.acquireTokenPopup(tokenRequest)
                        .then(response => {
                            // get access token from response
                            // response.accessToken
                        })
                        .catch(err => {
                            // handle error
                        });
                }
            });
    } else {
        // user is not logged in, you will need to log them in to acquire a token
    }
    } catch (err) {
      // user is not logged in, you will need to log them in to acquire a token
    }
  }


}
