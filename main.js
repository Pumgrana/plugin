/******************************************************************************
 ****************************** META MANAGEMENT
 *******************************************************************************/

var DESCRIPTION_ELEMENTS = [
  {"block":"meta", "name":"description"}
]

var IMAGE_ELEMENTS = [
  {"block":"meta", "name":"og:image"},
  {"block":"meta", "name":"twitter:image:src"}
]

function meta()
{
  var lang = safe($("html")[0], "lang")
  var title = safe($("title")[0], "text");
  var desc = safe(finder(DESCRIPTION_ELEMENTS)[0], "content");
  var img = safe(finder(IMAGE_ELEMENTS)[0], "content");

  return { "lang": lang,
           "title": title,
           "description": desc,
           "image": img }
}

/******************************************************************************
 ****************************** FOCUS MANAGEMENT
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
****************************** LOAD / LEAVE
*******************************************************************************/

var ENTER_TS = 0;
function on_load()
{
  ENTER_TS = now();
  on_visibility_change(ENTER_TS);

  setTimeout(get_search, 2000);
  setTimeout(link_listener, 2000);
};
window.onload = on_load();
on_load();

function on_leave()
{
  var leave_ts = now();
  var focus_elapsed_time = on_blur(leave_ts);

  var meta = meta();
  var data = { "origin_url": document.referrer,
               "target_url": TARGET_URL,
               "lang": meta["lang"],
               "title": meta["title"],
               "description": meta["description"],
               "image": meta["image"],
               "search": SEARCH_VALUE,
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

  // console.log(data);
  // return JSON.stringify(data);
};
window.onbeforeunload = on_leave;


/******************************************************************************
 ****************************** SEARCH
 *******************************************************************************/

var SEARCH_INPUTS = [
  {"block":"input", "type":"search"},
  {"block":"input", "type":"text",   "name":"q"},
  {"block":"input", "type":"text",   "name":"s"},
  {"block":"input", "type":"text",   "name":"query"},
  {"block":"input", "type":"text",   "name":"search"},
  {"block":"input", "type":"text",   "name":"keywords"},
  {"block":"input", "type":"text",   "name":"field-keywords"},
  {"block":"input", "type":"text",   "name":"motcle"}
]

var SEARCH_VALUE = null;
function get_search()
{
  var inputs = finder(SEARCH_INPUTS);

  if (inputs.length == 0) SEARCH_VALUE = null;
  else SEARCH_VALUE = inputs[0].value;

  return SEARCH_VALUE;
}


/******************************************************************************
 ****************************** LINKS
 *******************************************************************************/

function href(link)
{
  return function() { TARGET_URL=link.href; }
}

var TARGET_URL=null;
function link_listener()
{
  var links = finder([{"block":"a"}])

  var i = 0;
  while (i < links.length)
  {
    $(links[i]).on("click", href(links[i]));
    i += 1;
  }
}

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

function finder(fields)
{
  var query = "";
  for (var i in fields)
  {
    var field = fields[i];
    var sep = (query.length > 0) ? ", " : "";

    var args = "";
    for (var key in field)
    {
      if (key != "block") { args += "["+ key +"='"+ field[key] +"']" }
    }

    query += sep + field.block + args;
  }

  return $(query);
}

function safe(element, key)
{
  if (typeof element == "object" && element[key] != undefined)
    return element[key];
  return element;
}
