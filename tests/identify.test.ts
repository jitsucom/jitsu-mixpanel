import {DestinationContext, testDestination} from "@jitsu/jitsu-types";
import {adapter} from "../src";

/**
 * Represents context data of configured destination instance
 */
const testContext: DestinationContext = {
    destinationId: "abc123",
    destinationType: "mixpanel",
    token: "123",
    users_enabled: true,
    anonymous_users_enabled: true
}

const date = new Date()
const isoDate = date.toISOString()
const epoch = date.getTime()

testDestination({
        name: "identify",
        context: testContext,
        transform: ($, context) => adapter($, context),
        event: {
            _timestamp: isoDate,
            event_type: "identify",
            user: {
                email: "support@jitsu.com",
                anonymous_id: "1234567"
            }
        },
        expectedResult: [
            {
                "body": "data=" + encodeURIComponent(JSON.stringify(
                    {
                        "event": "$create_alias",
                        "properties": {
                            "alias": "1234567",
                            "distinct_id": "support@jitsu.com",
                            "token": testContext.token
                        }
                    }
                )),
                "headers": {"Content-Type": "application/x-www-form-urlencoded"},
                "method": "POST",
                "url": "https://api.mixpanel.com/track"
            },
            {
                "body": "data=" + encodeURIComponent(JSON.stringify(
                    [{
                        "$token": testContext.token,
                        "$distinct_id": "support@jitsu.com",
                        "$set": {
                            "$email": "support@jitsu.com"
                        }
                    }, {
                        "$token": testContext.token,
                        "$distinct_id": "support@jitsu.com",
                        "$set_once": {
                            "$initial_referrer": "$direct",
                            "$initial_referring_domain": "$direct"
                        }
                    }]
                )),
                "headers": {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                "method": "POST",
                "url": "https://api.mixpanel.com/engage"
            }
        ]
    }
)