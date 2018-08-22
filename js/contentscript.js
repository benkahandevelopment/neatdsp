/**
 * Functions
 **/

function output(a){
    console.log('NeatDSP > js/contentscript.js > '+a);
}


//Dissect URLs
function getUrl(type, url){
    if(type==="dbm"){
        var ret = {};
        var parts = url.split("/");

        var i = 0;
        while(i < parts.length){
            if(parts[i] == "p"){
                ret['par'] = parts[i+1];
                i++;
            } else if(parts[i] == "a"){
                ret['adv'] = parts[i+1];
                i++;
            } else if(parts[i]=="c"){
                ret['cmp'] = parts[i+1];
                i++;
            }
            i++;
        }
        return ret;
    } else if(type==="aap"){
        var ret = {};
        var parts = url.split("/");

        if(parts[parts.length-1]=="home"){
            ret['par'] = parts[parts.length-2];
        } else {
            var i = 0;
            while(i < parts.length){
                if(parts[i] == "aap" && parts[i+1]!==undefined){
                    ret['adv'] = parts[i+1];
                    i++;
                } else if(parts[i]=="orders" && parts[i+1]!==undefined){
                    ret['cmp'] = parts[i+1];
                    i++;
                }
                i++;
            }
        }
        return ret;
    } else if(type==="yahoo"){
        var ret = {};
        var parts = url.split("/");
        var i = 0;
        while(i < parts.length){
            if(parts[i]=="advertisers"){
                ret['adv'] = parts[i+1];
                i++;
            } else if(parts[i]=="campaigns"){
                ret['cmp'] = parts[i+1];
                i++;
            }
            i++;
        }
        return ret;
    } else return false;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (msg, sender, response) {
    if ((msg.from === 'popup') && (msg.subject === 'dspInfo')) {
        output('Request from popup');

        if(window.location.href.toLowerCase().indexOf("google.com/ddm/bidmanager") > -1
            || window.location.href.toLowerCase().indexOf("displayvideo.google.com") > -1){
            var a = [];
            var $b = $('div.breadcrumbs').find('.breadcrumbs-node');
            $b.each(function(i,v){
                var u = $(this).find('a').attr('href');
                a.push({
                    'label': $(this).find('a > label').html(),
                    'url': u,
                    'data': getUrl("dbm", u)
                });
            });
            var dbmInfo = { object: a, dsp: 'dbm' };
            response(dbmInfo);
            return false;
        }

        if(window.location.href.toLowerCase().indexOf("ams.amazon.com/aap") > -1){
            var a = [];
            var $b = $("#breadcrumbs li");
            $b.each(function(i,v){
                var u = $(this).find('a').attr('href');
                if(u !== undefined && $(this).find('a').html()!="Advertisers"){
                    a.push({
                        'label': $(this).find('a').html(),
                        'url' : u,
                        'data': getUrl("aap", u)
                    })
                }
            });

            var $c = $('a.a-link-normal.entity_name:eq(1)');
            a.push({
                'label' : $c.html(),
                'url' : $c.attr('href'),
                'data' : getUrl("aap", $c.attr('href'))
            });

            if(window.location.href.toLowerCase().indexOf("/line-items") > -1){
                a.push({
                    'label': $('h1.a-text-left > span.a-text-bold').html(),
                    'url' : window.location.href,
                    'data' : getUrl("aap", window.location.href)
                });
            }
            var aapInfo = { object: a, dsp: 'aap' };
            response(aapInfo);
            return false;
        }

        if(window.location.href.toLowerCase().indexOf("admanagerplus.yahoo.com") > -1){
            var a = [];
            var $b = $("ol.breadcrumb").first().find('a');
            $b.each(function(i,v){
                var u = $(this).attr('href');
                a.push({
                    'label': $(this).html(),
                    'url': u,
                    'data': getUrl("yahoo", u)
                });
            });

            if(window.location.href.toLowerCase().indexOf("/lines") > -1){
                a.push({
                    'label': $('h2.h1.title-heading > span.name').html(),
                    'url' : window.location.href,
                    'data' : getUrl("yahoo", window.location.href)
                });
            }

            var yahooInfo = { object: a, dsp: "yahoo" };
            response(yahooInfo);
            return false;
        }

        if(window.location.href.toLowerCase().indexOf("desk.thetradedesk.com") > -1){
            
        }
    }
});
