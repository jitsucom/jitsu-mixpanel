import {DestinationAdapter, DestinationDescriptor} from "@jitsu/jitsu-types/src/destination";
import jitsuMixpanel from "./jitsu-mixpanel";

const adapter: DestinationAdapter = jitsuMixpanel

const descriptor: DestinationDescriptor = {
    type: "mixpanel",
    displayName: "Mixpanel",
    icon: "",
    description: "Jitsu can send events from JS SDK or Events API to Mixpanel Ingestion API filling as much Mixpanel Events " +
        "Properties as possible from original event data.",
    configurationParameters: [
        {
            id: "token",
            type: "string",
            required: true,
            displayName: "Project Token",
            documentation: "<a href=\"https://developer.mixpanel.com/reference/project-token\">Project Token</a>. A project's token can be\n" +
                "          found in the Access Keys section of a project's settings overview page:{\" \"}\n" +
                "          <a href=\"https://mixpanel.com/settings/project/\">https://mixpanel.com/settings/project/</a>",
        },
        {
            id: "users_enabled",
            type: "boolean",
            required: false,
            displayName: "Project Token",
            documentation: "Enables Mixpanel destination to work with User Profiles. <br />" +
                " See <a href=\"https://jitsu.com/docs/destinations-configuration/mixpanel#user-profiles\">User Profiles</a>" +
                " section of Documentation",
        },
        {
            id: "anonymous_users_enabled",
            type: "boolean",
            required: false,
            displayName: "User Profiles for anonymous users",
            documentation: "Enables updating User Profiles for anonymous users. Requires <b>Enable User Profiles</b> enabled",
        },
    ],

}


export {descriptor, adapter}



