import {destination} from "../src";
import {JitsuDestinationContext} from "@jitsu/types/extension";
import {testDestination} from "@jitsu/cli/lib/tests";

/**
 * Represents context data of configured destination instance
 */
const testContext: JitsuDestinationContext = {
    destinationId: "abc123",
    destinationType: "mixpanel",
    config: {
        token: "123",
        users_enabled: true,
        anonymous_users_enabled: true
    },
}

const date = new Date()
const isoDate = date.toISOString()
const epoch = date.getTime()

testDestination({
        name: "identify",
        context: testContext,
        destination: destination,
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
                            "token": testContext.config.token
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
                        "$token": testContext.config.token,
                        "$distinct_id": "support@jitsu.com",
                        "$set": {
                            "$email": "support@jitsu.com"
                        }
                    }, {
                        "$token": testContext.config.token,
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