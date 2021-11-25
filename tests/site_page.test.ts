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
        name: "site_page",
        context: testContext,
        transform: ($, context) => adapter($, context),
        event: {
            _timestamp: isoDate,
            event_type: "site_page",
        },
        expectedResult: [
            {
                "body": "data=" + encodeURIComponent(JSON.stringify(
                    {
                        "event": "Page View",
                        "properties": {
                            "token": testContext.token,
                            "time": epoch
                        }
                    }
                )),
                "headers": {"Content-Type": "application/x-www-form-urlencoded"},
                "method": "POST",
                "url": "https://api.mixpanel.com/track"
            }]
    }
)

testDestination({
        name: "with user",
        context: testContext,
        transform: ($, context) => adapter($, context),
        event: {
            _timestamp: isoDate,
            event_type: "Page View",
            user: {
                email: "support@jitsu.com",
                anonymous_id: "1234567"
            }
        },
        expectedResult: [
            {
                "body": "data=" + encodeURIComponent(JSON.stringify(
                    {
                        "event": "Page View",
                        "properties": {
                            "token": testContext.token,
                            "time": epoch,
                            "$identified_id": "support@jitsu.com",
                            "$anon_id": "1234567",
                            "$distinct_id": "support@jitsu.com",
                            "distinct_id": "support@jitsu.com",
                            "$email": "support@jitsu.com"
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
                            "Last Page View": isoDate
                        }
                    }, {
                        "$token": testContext.token,
                        "$distinct_id": "support@jitsu.com",
                        "$add": {
                            "Page View": 1
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

