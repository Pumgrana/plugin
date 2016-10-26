/******************************************************************************
****************************** ON FOCUS
*******************************************************************************/

var HIDDEN = "hidden";
function init_visibility_handler()
{
    if (typeof document.hidden !== "undefined")
    {
        // Opera 12.10 and Firefox 18 and later support
        HIDDEN = "hidden";
        event = "visibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
        HIDDEN = "msHidden";
        event = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
        HIDDEN = "webkitHidden";
        event = "webkitvisibilitychange";
    }
    document.addEventListener(event, on_visibility_change, false);
}
init_visibility_handler();

function on_visibility_change(ts)
{
    if (document[HIDDEN]) on_blur(ts);
    else on_focus(ts);
}

var FOCUS_TS = 0;
function on_focus(ts)
{
    if (FOCUS_TS != 0 && !Number.isInteger(ts)) return ;

    if (Number.isInteger(ts)) FOCUS_TS = ts;
    else FOCUS_TS = now();
};

var FOCUS_ELAPSED_TIME = 0;
function on_blur(ts)
{
    if (FOCUS_TS == 0) return FOCUS_ELAPSED_TIME;

    var end_ts = now();
    if (Number.isInteger(ts)) end_ts = ts;

    FOCUS_ELAPSED_TIME += (end_ts - FOCUS_TS);
    FOCUS_TS = 0;

    return FOCUS_ELAPSED_TIME;
};

/******************************************************************************
****************************** ON LOAD
*******************************************************************************/

var ENTER_TS = 0;
function on_load()
{
    ENTER_TS = now();
    on_visibility_change(ENTER_TS);
};
window.onload = on_load();
on_load();

function on_leave()
{
    var leave_ts = now();
    var focus_elapsed_time = on_blur(leave_ts);
    var data = { "origin": document.referrer,
                 "enter_date": date_string(ENTER_TS),
                 "leave_date": date_string(leave_ts),
                 "focus_elasped_time": focus_elapsed_time,
                 "total_elasped_time": leave_ts - ENTER_TS,
                 "url": window.location.href };

    $.ajax({
        type: "POST",
        url: "http://api.pumgrana.com/historical",
        data: JSON.stringify(data),
        dataType: "json"
    });

    // return JSON.stringify(data);
};
window.onbeforeunload = on_leave;


/******************************************************************************
****************************** UTILS
*******************************************************************************/

function now()
{
    return new Date().getTime();
};

function stringify(number)
{
    if (number < 10) return "0"+ number;
    return number.toString();
}

function date_string(ts)
{
    var date = new Date(ts);
    var tz = new Date().getTimezoneOffset();
    var sign = "-";
    if (tz < 0)
    {
        tz = -tz;
        sign = "+"
    }
    var tz_min = tz % 60;
    var tz_hour = tz / 60;
    var str_tz = stringify(tz_hour) +":"+ stringify(tz_min);
    date.setMinutes(date.getMinutes() + tz_min);
    date.setHours(date.getHours() + tz_hour);
    var iso = date.toISOString().slice(0, -1) + sign + str_tz;
    return iso
}