import {DestinationMessage, JitsuContext} from "@jitsu/jitsu-types/src/destination";
import {JitsuEvent} from "@jitsu/jitsu-types/src/event";

export default function TransformFunction(event: JitsuEvent, dstContext: JitsuContext) {
    const context = event.eventn_ctx || event;
    const user = context.user || {};
    const utm = context.utm || {};
    const location = context.location || {};
    const ua = context.parsed_ua || {};
    const conversion = context.conversion || {};

    const matches = context.referer?.match(
        /^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i
    );
    const refDomain = matches && matches[1]; // domain will be null if no match is found

    const mustUpdateUserProfile =
        dstContext.users_enabled &&
        (user.internal_id || user.email || (dstContext.anonymous_users_enabled && (user.anonymous_id || user.hashed_anonymous_id)));

    function getEventType($) {
        switch ($.event_type) {
            case "user_identify":
            case "identify":
                return "$identify";
            case "page":
            case "pageview":
            case "site_page":
                return "Page View";
            default:
                return $.event_type;
        }
    }

    const eventType = getEventType(event);

    let envelops:DestinationMessage[] = [];
    let $set = {};
    let $set_once = {};
    let $add = {};

    //on identify
    if (eventType === "$identify") {
        //create an alias user id -> anon id
        if (
            (user.internal_id || user.email) &&
            (user.anonymous_id || user.hashed_anonymous_id)
        ) {
            envelops.push({
                    url: "https://api.mixpanel.com/track",
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body:
                        "data=" +
                        encodeURIComponent(
                            JSON.stringify({
                                event: "$create_alias",
                                properties: {
                                    alias: user.anonymous_id || user.hashed_anonymous_id,
                                    distinct_id: user.internal_id || user.email,
                                    token: dstContext.token,
                                },
                            })
                        ),
                });
        }

        if (mustUpdateUserProfile) {
            $set = {
                $email: user.email,
                $name: user.name,
                $username: user.username,
                $first_name: user.firstName || user.first_name,
                $last_name: user.lastName || user.last_name,
                $phone: user.phone,
                $avatar: user.avatar,
                $country_code: location.country,
                $city: location.city,
                $region: location.region,
                $browser: ua.ua_family,
                $browser_version: ua.ua_version,
                $os: ua.os_family,
                $referring_domain: refDomain,
            };
            //Set User Profile Properties Once
            $set_once = {
                $initial_referrer: context.referer || "$direct",
                $initial_referring_domain: refDomain || "$direct",
            };
        }
    }
    if (eventType !== "$identify") {
        envelops.push({
                url: "https://api.mixpanel.com/track",
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body:
                    "data=" +
                    encodeURIComponent(
                        JSON.stringify({
                            event: eventType,
                            properties: {
                                token: dstContext.token,
                                time: new Date(event._timestamp).getTime(),
                                $insert_id: event.eventn_ctx_event_id || context.event_id,
                                $current_url: context.url,
                                $referrer: context.referer,
                                $referring_domain: refDomain,
                                $identified_id: user.internal_id || user.email,
                                $anon_id: user.anonymous_id || user.hashed_anonymous_id,
                                $distinct_id:
                                    user.internal_id ||
                                    user.email ||
                                    user.anonymous_id ||
                                    user.hashed_anonymous_id,
                                distinct_id:
                                    user.internal_id ||
                                    user.email ||
                                    user.anonymous_id ||
                                    user.hashed_anonymous_id,
                                $email: user.email,
                                ip: event.source_ip,
                                $browser: ua.ua_family,
                                $browser_version: ua.ua_version,
                                $os: ua.os_family,
                                $city: location.city,
                                $region: location.region,
                                $country_code: location.country,
                                mp_country_code: location.country,
                                $screen_width: context.screen_resolution?.split("x")[0],
                                $screen_height: context.screen_resolution?.split("x")[1],
                                utm_medium: utm.medium,
                                utm_source: utm.source,
                                utm_campaign: utm.campaign,
                                utm_content: utm.content,
                                utm_term: utm.term,
                                Revenue: conversion.revenue || event.revenue
                            },
                        })
                    ),
            });

        if (mustUpdateUserProfile) {
            $set = {
                [`Last ${eventType}`]: event._timestamp,
            };
            $add = {
                [eventType]: 1,
            };
            if (conversion.revenue || event.revenue) {
                $add["Lifetime Revenue"] = conversion.revenue || event.revenue;
            }
        }
    }

    if (mustUpdateUserProfile) {
        //Set User Profile Properties

        let userProfileUpdates = {
            $set,
            $set_once,
            $add,
        };

        //Make a separate API request for engageObject properties.
        //Use batch update for updating multiple properties with one request
        let engages = [];
        Object.keys(userProfileUpdates).forEach((key) => {
            const engage = userProfileUpdates[key];

            if (Object.keys(engage).length > 0) {
                engages.push({
                    $token: dstContext.token,
                    $distinct_id:
                        user.internal_id ||
                        user.email ||
                        user.anonymous_id ||
                        user.hashed_anonymous_id,
                    $ip: event.source_ip,
                    [key]: engage,
                });
            }
        });
        if (engages.length > 0) {
            envelops.push({
                    url: "https://api.mixpanel.com/engage",
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: "data=" + encodeURIComponent(JSON.stringify(engages)),
                });
        }
    }
    return envelops;
}
