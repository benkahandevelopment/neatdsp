$(function(){

    /**
    * Event listeners **/

        //Close window
        $('.btnclose').click(function(){ window.close(); });

        //Open links 1
        $('a[data-target=_blank]:not([disabled])').click(function(){
            var href = $(this).attr('data-url');
            chrome.tabs.create({ url:href, active:true });
        });

        //Open links 2
        $(document.body).on('click', '#all-list li > a', function(){
            var a = {
                'id' : $(this).attr('data-id'),
                'text' : $(this).html()
            };
            load(true);
            selectCmp(a);
        });

        //Collapsable boxes - click event
        $('.collapse').click(function(){
            var $el = $(this);
            $el.attr('data-collapse', $el.attr('data-collapse')==1 ? 0 : 1);
            if($el.attr('data-collapse')==1) $(this).parent().find('.collapsable').slideUp(250);
                else $(this).parent().find('.collapsable').slideDown(150);

            var c = [];
            $(".collapse").each(function(v,i){
                c.push($(this).attr('data-collapse'));
            })
            chrome.storage.sync.set({"collapse" : c});
        });

        //Edit campaign name
        $(document.body).on('click', '.ico-cont i.fa-edit', function(){
            var $el = $(this).parent().parent().find('div:eq(0)');
            $el.find('h3').hide();
            $el.find('input').val($el.find('h3').html()).show().focus();
            $(this).removeClass('fa-edit').addClass('fa-check');
        });

        //Save campaign name 1
        $(document.body).on('click', '.ico-cont i.fa-check', function(){ saveCmpName(); });

        //Save campaign name 2
        $('input[name=data-cmp]').keypress(function(e){ if(e.which == 13){ saveCmpName(); } })

        //Campaign row - link 1
        $(document.body).on('click', '.cmp-row-link', function(){
            var $e = $(this).parent().parent();
            linkOut($e); //where $e is an element with data-dsp and relevant ids
        });

        //Campaign row - link 2
        $(document.body).on('click', 'ul.closed-response > li', function(){
            var $e = $(this);
            if($e.attr('data-dsp')=='dbm'){
                var p = $e.attr('data-par-id');
                var a = $e.attr('data-adv-id');
                var c = $e.attr('data-dsp-id');
                var href = 'https://www.google.com/ddm/bidmanager/#ng_nav/p/'+p+'/a/'+a+'/c/'+c;
                chrome.tabs.create({url:href,active:true});
            } else if($e.attr('data-dsp')=='aap'){
                var a = $e.attr('data-adv-id');
                var c = $e.attr('data-dsp-id');
                var href = 'https://ams.amazon.com/aap/'+a+'/orders/'+c+'/line-items';
                chrome.tabs.create({url:href,active:true});
            } else if($e.attr('data-dsp')=='yahoo'){
                var c = $e.attr('data-dsp-id');
                var href = 'https://admanagerplus.yahoo.com/app/campaigns/'+c+'/lines';
                chrome.tabs.create({url:href,active:true});
            }
        });

        //Campaign row - delete
        $(document.body).on('click', '.cmp-btns > .cmp-row-delete', function(){
            load(true);
            var $e = $(this).parent().parent();
            var id = $('#info-cmp-display').attr('data-id');
            var c_dsp = $e.attr('data-dsp');
            var c_id = $e.attr('data-dsp-id');

            chrome.storage.sync.get({"campaigns":[]}, function(o){
                var cmps = o.campaigns;

                cmps[id].cmps.forEach(function(v,i){
                    if(v[0].dsp == c_dsp && v[0].dsp_id == c_id){
                        cmps[id].cmps.splice(i, 1);
                    }
                });

                chrome.storage.sync.set({"campaigns":cmps});
                refreshThisCmp();
            });
        });

        //Campaign object - delete (MODAL CALLBACK 1)
        $(document.body).on('click', '.cmp-delete', function(){

            $("#modalConfirm [data-modal=title]").html("Delete Campaign");
            $("#modalConfirm [data-modal=body]").html("Are you sure you wish to delete the selected campaign?<br><br>This cannot be undone.");
            $("#modalConfirm button.btn-primary").html("Delete");
            $("#modalConfirm button.btn-secondary").html("Cancel");
            $("#modalConfirm [data-callback]").attr("data-callback",1).attr('data-id', $(this).parent().parent().find('a').attr('data-id'));
            $("#modalConfirm").modal();

        });


    /**
     * Modals & Responses **/

        $(document.body).on('click', "button[data-callback]", function(){
            var cb = $(this).attr('data-callback');
            $("#modalConfirm").modal('hide');

            if(cb==1){
                var id = $(this).attr('data-id');

                if(id == $('#info-cmp-display').attr('data-id')){
                    console.error("Could not delete currently selected campaign");
                    msgModal("Error", "Cannot delete currently selected campaign. Swap active campaigns to delete the selected object", "OK");
                    return false;
                }

                load(true);
                $("#info-all-display li > a[data-id="+id+"]").parent().remove();

                chrome.storage.sync.get({"campaigns":[]}, function(o){
                    var cmps = o.campaigns;
                    cmps.splice(id, 1);
                    chrome.storage.sync.set({"campaigns":cmps});

                    refreshThisCmp();
                })
            }
        });

        //Add 'this page' object to campaign
        $(document.body).on('click', '.cmp-add', function(){
            load(true);
            var $t = $(this);
            var obj = $t.parent().find('.info-title');

            //DBM cases
            if(obj.attr("data-dsp")=="dbm"){

                //Campaigns
                if(obj.attr("data-info")=="cmp"){
                    //Also save partner/advertiser data
                    var advId = $('div.info-title[data-info=adv]').attr('data-dsp-id');
                    var parId = $('div.info-title[data-info=par]').attr('data-dsp-id');

                    chrome.storage.sync.get({"campaigns":[]}, function(o){
                        var cmps = o.campaigns;
                        var id = parseInt($("#info-cmp-display").attr("data-id"));
                        var newArr = {
                            'dsp' : 'dbm',
                            'name' : obj.html(),
                            'dsp_id' : obj.attr('data-dsp-id'),
                            'adv_id' : advId,
                            'par_id' : parId
                        };
                        cmps[id]['cmps'].push([newArr]);
                        chrome.storage.sync.set({"campaigns":cmps});
                        refreshThisCmp();
                    });
                }
            }

            //AAP Cases
            if(obj.attr("data-dsp")=="aap"){

                //Campaigns
                if(obj.attr("data-info")=="cmp"){
                    //Also save partner/advertiser data
                    var advId = $('div.info-title[data-info=adv]').attr('data-dsp-id');
                    var parId = $('div.info-title[data-info=par]').attr('data-dsp-id');

                    chrome.storage.sync.get({"campaigns":[]}, function(o){
                        var cmps = o.campaigns;
                        var id = parseInt($("#info-cmp-display").attr("data-id"));
                        var newArr = {
                            'dsp' : 'aap',
                            'name' : obj.html(),
                            'dsp_id' : obj.attr('data-dsp-id'),
                            'adv_id' : advId,
                            'par_id' : parId
                        };
                        cmps[id]['cmps'].push([newArr]);
                        chrome.storage.sync.set({"campaigns":cmps});
                        refreshThisCmp();
                    });
                }
            }

            //Yahoo Cases
            if(obj.attr("data-dsp")=="yahoo"){

                //Campaigns
                if(obj.attr("data-info")=="cmp"){
                    chrome.storage.sync.get({"campaigns":[]}, function(o){
                        var cmps = o.campaigns;
                        var id = parseInt($("#info-cmp-display").attr("data-id"));
                        var newArr = {
                            'dsp' : 'yahoo',
                            'name' : obj.html(),
                            'dsp_id' : obj.attr('data-dsp-id')
                        };
                        cmps[id]['cmps'].push([newArr]);
                        chrome.storage.sync.set({"campaigns":cmps});
                        refreshThisCmp();
                    });
                }
            }
        });

        //Create new campaign
        $(document.body).on('click', '.cmp-new', function(){
            load(true);
            var $t = $(this);
            var n = $.trim($('input[name=cmp-new]').val());

            if(n.length<3){
                feedback("Invalid Name", "Campaign name must be 3 characters or more");
                load(false);
                return false;
            }

            //Add campaign to storage
            chrome.storage.sync.get({"campaigns":[]}, function(o){
                var cmps = o.campaigns;
                var id = 0;

                if(cmps.length < 1){
                    id = 1;
                } else {
                    cmps.forEach(function(v, i){
                        if(i >= id) id = i + 1;
                    });
                }

                cmps[id] = {
                    'name' : n,
                    'cmps' : []
                };
                chrome.storage.sync.set({"campaigns" : cmps});
                chrome.storage.sync.set({"selectedCmp" : id})
                window.location.reload();
            });

        });


    /**
     * Other launch functions **/

        //Collapsable boxes - load saved data
        chrome.storage.sync.get({"collapse":[0,0]}, function(e){
            var c = e.collapse;
            c.forEach(function(v,i){
                var $el = $(".collapse:eq("+(parseInt(i))+")");
                $el.attr("data-collapse",parseInt(v));
                if(v==1) $el.parent().find('.collapsable').hide();
            });
        });

        //Load campaigns
        chrome.storage.sync.get({"campaigns":[]}, function(o){
            load(true);
            var cmps = o.campaigns;
            var cmpdata = [];
            if(cmps.length>0){
                cmps.forEach(function(i,v){
                    if(i!=null) {
                        cmpdata.push({id:v, text:i.name});

                        //Add to full list output
                        var $o = $("#all-list");
                        var x =
                            "<li class='list-group-item d-flex align-items-center'>"+
                                "<span class='badge badge-info badge-pill mr-2'>"+i.cmps.length+"</span>"+
                                "<a href='#' data-id='"+v+"'>"+i.name+"</a>"+
                                "<div class='btn-group ml-auto'><button type='button' class='btn btn-sm btn-outline-danger cmp-delete' data-toggle='tooltip' data-placement='bottom' title='Delete Campaign'><i class='fa fa-fw fa-trash'></i></div>"
                            "</li>";
                        $o.append(x);
                    }
                });
            }

            //Initialize select2
            $('#info-cmp-search select').select2({ placeholder: 'No campaign selected', data: cmpdata });
            $('#info-cmp-search select').on("select2:unselect", () => { $('#info-cmp-search select').on("select2:open", () => { $(".select2-search__field").val(""); }); });

            $('#navbar-search select').select2({ placeholder: 'No campaign selected', data: cmpdata });
            $('#navbar-search select').on("select2:unselect", () => { $('#info-cmp-search select').on("select2:open", () => { $(".select2-search__field").val(""); }); });

            $('#closed-search-cont select').select2({ placeholder: 'Choose a campaign', data: cmpdata });
            $('#closed-search-cont select').on("select2:unselect", () => { $('#info-cmp-search select').on("select2:open", () => { $(".select2-search__field").val(""); }); });

            //On campaign selection
            $('#info-cmp-search select').on('select2:select', function (e) { selectCmp(e.params.data); });
            $('#navbar-search select').on('select2:select', function (e) { selectCmp(e.params.data); });

            $('#closed-search-cont select').on('select2:select', function (e) {
                var d = e.params.data;
                chrome.storage.sync.set({"selectedCmp" : d.id});

                load(true);
                var $outEl = $("ul.closed-response");
                $outEl.html('');

                //Load objects under campaign
                chrome.storage.sync.get({"campaigns":[]}, function(o){
                    var cmps = o.campaigns;

                    cmps[d.id].cmps.forEach(function(v,i){
                        var data = v[0];
                        var icon = (data.dsp=="dbm" ? "google" : (data.dsp=="aap" ? "amazon" : "yahoo"));
                        var output = "<li data-dsp='"+data.dsp+"' data-dsp-id='"+data.dsp_id+"' data-adv-id='"+data.adv_id+"' data-par-id='"+data.par_id+"'>"+
                        "<i class='fab fa-fw fa-"+icon+"'></i>"+data.name+"<!--<span>"+data.dsp_id+"</span>--></li>";
                        $outEl.append(output);
                    });

                    load(false);
                });
            });

            //Save last campaign selection
            chrome.storage.sync.get({"selectedCmp":0}, function(x){
                var id = parseInt(x.selectedCmp);
                $("#navbar-search select").val([id]);
                $("#navbar-search select").trigger("change");

                $("#info-cmp-display").attr('data-id', id);
                $("#info-cmp-display").attr('data-name', $('#navbar-search select option[value='+id+']').html());
                refreshThisCmp();
            });
        });

        //Load images
        var img = {};
        img['logo32'] = chrome.extension.getURL("img/icon32.png");

        //Insert images
        $(".img-logo").attr('src',img.logo32);

        //Get DSP page data
        chrome.tabs.query({
                active: true,
                currentWindow: true
            }, function(tabs){
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { from: 'popup', subject: 'dspInfo' },
                    setDspInfo
                );
            });
});

/**
 * Functions **/

//Refresh selected campaign data
function refreshThisCmp(){
    load(true);
    var $outEl = $("ul#cmp-list");
    $outEl.html('');

    var $e = $("#info-cmp-display");
    var cmpId = $e.attr('data-id');

    if(cmpId==0||cmpId===undefined) return false;

    $e.find('[data-cmp=name]').html($e.attr('data-name'));
    $e.find('[data-cmp=id]').html("#"+cmpId);

    //Load objects under campaign
    chrome.storage.sync.get({"campaigns":[]}, function(o){
        var cmps = o.campaigns;

        //$outEl.append("<li class='title'>Campaign Objects <i class='fa fa-fw fa-angle-down'></i></li>");
        cmps[cmpId].cmps.forEach(function(v,i){
            var data = v[0];
            var icon = (data.dsp=="dbm" ? "google" : (data.dsp=="aap" ? "amazon" : "yahoo"));
            var output = "<li class='cmp-cmp list-group-item d-flex align-items-center' data-dsp='"+data.dsp+"' data-dsp-id='"+data.dsp_id+"' data-adv-id='"+data.adv_id+"' data-par-id='"+data.par_id+"'>"+
            "<div class='pr-2'>"+
                "<i class='fab fa-fw fa-"+icon+" mr-2'></i>"+
            "</div><div>"+
                "<a href='#' class='cmp-row-link'>"+data.name+"</a>"+
                "<br/><small class='text-muted text-sm'>"+data.dsp_id+"</small>"+
            "</div>"+
            "<div class='cmp-btns btn-group ml-auto'>"+
                "<button type='button' class='btn btn-sm btn-outline-danger cmp-row-delete' data-toggle='tooltip' data-placement='bottom' title='Remove from Campaign'><i class='cursor-p fa fa-fw fa-trash'></i></button>"+
                //"<button type='button' class='btn btn-sm ml-1 btn-outline-success cmp-row-link' data-toggle='tooltip' data-placement='bottom' title='Visit this strategy'><i class='cursor-p fa fa-fw fa-external-link-square-alt'></i></button>"+
            "</div></li>";
            $outEl.append(output);
        });

        //Tooltips
        $('[data-toggle="tooltip"]').tooltip();

        //Scroll back up to top
        $('.page').animate({ scrollTop: 0 }, 250);

        load(false);
    });
}

//Feedback message
function feedback(title, message){
    msgModal(title || 'Alert', message, 'OK');
}

//Add DSP page data to popup
function setDspInfo(i){
    load(true);
    if(i===undefined){
        $("#info-page").hide();
    } else {
        var d = i.dsp;
        var i = i.object;
        var cmpData = [];

        i.forEach(function(a,v){
            if(a.data.hasOwnProperty("cmp")){
                cmpData['cmp'] = a;
            } else if(a.data.hasOwnProperty("adv")){
                cmpData['adv'] = a;
            } else if(a.data.hasOwnProperty("par")){
                cmpData['par'] = a;
            }
        });

        var ico = ( d == 'dbm' ? 'google' : ( d=='aap' ? 'amazon' : 'yahoo' ) );
        $('#info-page > h5 > i').removeClass().addClass('fa-fw').addClass('fab').addClass('fa-'+ico);
        ['par','adv','cmp'].forEach(function(v,i){
            if(cmpData[v]) $('[data-info='+v+']').html(cmpData[v].label).attr('data-href', cmpData[v].url).attr('data-dsp', d).attr('data-dsp-id', cmpData[v].data[v]);
        });

        if($("[data-info=cmp]").html()!="-") $(".cmp-add.collapse").addClass("show");
            else $(".cmp-add.collapse").removeClass("show");

        $("#info-page").show();

        load(false);
    }
}

//Save change to campaign name
function saveCmpName(){
    load(true);
    var $t = $('.ico-cont i:eq(0)');
    var $el = $t.parent().parent().find('div:eq(0)');
    $el.find('h3').show();
    $el.find('input').hide();
    $t.addClass('fa-edit').removeClass('fa-check');

    var id = $('#info-cmp-display').attr('data-id');
    var nt = $el.find('input').val();
    chrome.storage.sync.get({"campaigns":[]}, function(o){
        var cmps = o.campaigns;
        cmps[id].name = nt;
        chrome.storage.sync.set({"campaigns":cmps});
        $el.find('h3').html(nt);
        load(false);
    });
}

//Loader
function load(s){
    //if(s) $("#loader").fadeIn(100);
    if(s) $("#loader").show();
        else setTimeout(function(){ $("#loader").fadeOut(250); }, 250);
}

//Execute campaign selection (requires id, title)
function selectCmp(data){
    chrome.storage.sync.set({"selectedCmp" : data.id});
    $("#info-cmp-display").attr('data-id', data.id);
    $("#info-cmp-display").attr('data-name', data.text);

    $("#navbar-search select").val([data.id]);
    $("#navbar-search select").trigger("change");
    refreshThisCmp();
}

//Execute outbound hyperlink in new tab
function linkOut($e){
    if($e.attr('data-dsp')=='dbm'){
        var p = $e.attr('data-par-id');
        var a = $e.attr('data-adv-id');
        var c = $e.attr('data-dsp-id');
        var href = 'https://www.google.com/ddm/bidmanager/#ng_nav/p/'+p+'/a/'+a+'/c/'+c;
        chrome.tabs.create({url:href,active:true});
    } else if($e.attr('data-dsp')=='aap'){
        var a = $e.attr('data-adv-id');
        var c = $e.attr('data-dsp-id');
        var href = 'https://ams.amazon.com/aap/'+a+'/orders/'+c+'/line-items';
        chrome.tabs.create({url:href,active:true});
    } else if($e.attr('data-dsp')=='yahoo'){
        var c = $e.attr('data-dsp-id');
        var href = 'https://admanagerplus.yahoo.com/app/campaigns/'+c+'/lines';
        chrome.tabs.create({url:href,active:true});
    }
}

//Show modal with title, body, button etc.
function msgModal(title, body, btn){
    $("#modalMessage [data-modal=title]").html(title || "Error");
    $("#modalMessage [data-modal=body]").html(body || "The quick brown fox jumps over the lazy dog.");
    $("#modalMessage button.btn-secondary").html(btn || "OK");
    $("#modalMessage").modal();
}

/**
 * Development Functions **/

 //Clear all data
function clearStorage(){
    chrome.storage.sync.clear(function(){
        var error = chrome.runtime.lastError;
        error ? console.error(error) : console.log('Removed campaign data');
    });
}
