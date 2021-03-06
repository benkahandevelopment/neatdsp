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
        $(document.body).on('click', '#all-list li a.cmp-name', function(){
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
        $('input[name=data-cmp]').keypress(function(e){ if(e.which == 13){ saveCmpName(); } });

        //Save campaign name 3
        $('input[data-input=name]').keypress(function(e){ if(e.which == 13){ saveCmpName(); } });

        //Show/hide edit campaign
        $('.edit-field .btn-edit').click(function(){
            var $t = $(this);
            var $c = $(this).closest('.toggle-cont');
            $t.hide();
            $c.find('.edittoggle').toggle();
        });

        $('.edit-field .btn-cancel').click(function(){
            var $t = $(this);
            var $c = $t.closest('.toggle-cont');
            $c.find('.btn-edit').show();
            $c.find('.edittoggle').toggle();
        })

        //Campaign row - link 1
        $(document.body).on('click', '.cmp-row-link', function(){
            var $e = $(this).parent().parent().parent();
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

        //Campaign row - modify priority
        $(document.body).on('click', '.cmp-row-priority', function(){
            var data = {};
            data.cmpid = $("#info-cmp-display").attr('data-id');
            data.dspid = $(this).parent().parent().parent().attr('data-dsp-id');
            data.p = $(this).parent().parent().parent().attr('data-priority');

            $("#modalPriority").attr('data-id', data.cmpid);
            $("#modalPriority").attr('data-dsp-id', data.dspid);

            //$("#modalPriority div[data-group=note] > input").val(unescapeHtml(data.n));
            $("#modalPriority div[data-group=note] > input").val("");
            $("#modalPriority div[data-group=priority] > button").removeClass().addClass("btn").addClass("btn-secondary");
            $("#modalPriority div[data-group=priority] > button:eq("+parseInt(data.p)+")").removeClass("btn-secondary").addClass('btn-primary');
            $("#modalPriority").modal();
        });

        //Campaign row - show/hide notes
        $(document.body).on('click', '.toggle-notes', function(){
            $(this).parent().parent().parent().parent().find('.cmp-details ul').toggle();
        });

        //Campaign row - meta - delete note
        $(document.body).on('click', '.note-delete', function(){
            var $t = $(this);
            var $p = $t.parent().parent().parent().parent().parent();

            //objects > cmpid > dspid > note timestamp
            var data = {};
            data.dspid = $p.attr('data-dsp-id');
            data.cmpid = $p.parent().parent().attr('data-id');
            data.ts = $t.attr('data-ts');

            deleteNote(data);
        });

        //Priority modal - change selection
        $("#modalPriority div[data-group=priority] > button").click(function(){
            var $t = $(this);
            $("#modalPriority div[data-group=priority] > button").removeClass().addClass("btn").addClass("btn-secondary");
            $t.removeClass("btn-secondary").addClass("btn-primary");
        });

        //Priority modal - character count
        $("#modalPriority [data-group=note] > input").keyup(function(){
            var c = 140 - $(this).val().length;
            $(this).parent().find("[data-output=char-count]").html(c);
            if(c>40) $("[data-output=char-count]").removeClass();
            if(c<41) $("[data-output=char-count]").removeClass().addClass("text-warning");
            if(c<1) $("[data-output=char-count]").removeClass().addClass("text-danger");
        });

        //Priority modal - save
        $("#modalPriority .modal-footer .btn-success").click(function(){
            load(true);
            var data = {};
            data.cmpid = $("#modalPriority").attr('data-id');
            data.dspid = $("#modalPriority").attr('data-dsp-id');
            data.priority = $("#modalPriority div[data-group=priority] > button.btn-primary").attr('data-priority');
            data.note = $("#modalPriority div[data-group=note] > input").val();
            data.note = data.note.length > 140 ? data.note.substring(0,140) : data.note;

            chrome.storage.sync.get({"campaigns":[]}, function(o){
                var cmps = o.campaigns;
                cmps[data.cmpid].cmps.forEach(function(v,i){
                    if(v[0].dsp_id==data.dspid){
                        cmps[data.cmpid].cmps[i][0].priority = data.priority;

                        if(data.note.length>0){
                            var newnotes = cmps[data.cmpid].cmps[i][0].notes || [];
                            newnotes.push(JSON.stringify({
                                'msg' : data.note,
                                'timestamp' : + new Date()
                            }));

                            newnotes.sort(function(a,b){
                                return JSON.parse(a).timestamp > JSON.parse(b).timestamp ? -1 : 1;
                            });

                            cmps[data.cmpid].cmps[i][0].notes = newnotes;
                        }
                    }
                });
                chrome.storage.sync.set({ "campaigns": cmps });
                $("#modalPriority").modal('hide');
                refreshThisCmp();
                loadCampaigns();
            });
        })

        //Campaign row - delete
        $(document.body).on('click', '.cmp-btns > .cmp-row-delete', function(){
            load(true);
            var $e = $(this).parent().parent().parent();
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

        //Settings - versions
        $.get('https://raw.githubusercontent.com/benkahandevelopment/neatdsp/master/manifest.json', function(d){
            $('p[data-version=avail] > span').html(d.version);
            var avail = d.version;
            $.get('manifest.json', function(d){
                $('p[data-version=your] > span').html(d.version);
                var your = d.version;
                if(versionCompare(avail, your)>0) $("#update-links").show();
            }, 'json');
        }, 'json');

        //Settings - file download for exportAll
        $("#exportFile-btn").click(exportAll);

        //Settings - delete all data
        $("#deleteData-btn").click(function(){
            if(confirm("Are you sure? This cannot be undone.")) deleteData();
        });

        //Settings - file upload for import
        $("#importFile-btn").click(function(){ $("#importFile").click(); });
        $("#importFile").change(function(){
            var fr = new FileReader();
            fr.onload = function(){
                data = fr.result;
                data = JSON.parse(data);
                data_c = data.campaigns;
                chrome.storage.sync.set({"campaigns" : data_c});
                msgModal("Import", "Successfully imported campaign data", "Awesome");
            }
            fr.readAsText($("#importFile").prop('files')[0]);
        });

        //Optimization notes
        $("select[name=opt-limit]").change(function(){
            var $e = $("select[name=opt-limit]");
            var v = (parseInt($e.val()) * 1000 * 60 * 60 * 24);
            var x = parseInt(moment(new Date()).format("x") - v);

            $("#opt-list li").show();
            if($e.val()!=0){
                $("#opt-list li").each(function(){
                    if(parseInt($(this).attr('data-ts')) < x) $(this).hide();
                });
            }
        });

        //Optimizations - exportNotes
        $("#exportOpt-btn").click(exportOpt);

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
                    loadCampaigns();
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
                chrome.storage.sync.set({"selectedCmp" : id});
                window.location.reload();
            });

        });


    /**
     * Other launch functions **/

        //Load campaigns
        loadCampaigns();

        //Load optimization list
        refreshNotes();

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

    if(cmpId==0||cmpId===undefined||cmpId===null) {
        //No campaigns in system - most likely first launch!
        $e.find('[data-cmp=name]').html("No Saved Campaigns").parent().parent().removeClass("mb-3");
        load(false);
        return false;
    }

    $e.find('[data-cmp=name]').html($e.attr('data-name'));
    $e.find('[data-input=name]').val($e.attr('data-name'));
    $e.find('[data-cmp=id]').html("#"+cmpId);

    //Load objects under campaign
    chrome.storage.sync.get({"campaigns":[]}, function(o){
        var cmps = o.campaigns;

        //$outEl.append("<li class='title'>Campaign Objects <i class='fa fa-fw fa-angle-down'></i></li>");
        cmps[cmpId].cmps.forEach(function(v,i){
            var data = v[0];
            var icon = (data.dsp=="dbm" ? "google" : (data.dsp=="aap" ? "amazon" : "yahoo"));

            var priority = data.priority===undefined||data.priority===null ? 0 : data.priority;
            var priority_a = ['empty', 'quarter', 'half', 'three-quarters', 'full'];

            //var note = data.note===undefined||data.note===null ? "" : escapeHtml(data.note);
            var notes = data.notes===undefined||data.notes===null ? false : data.notes;
            var notes_output = notes ? "<ul class='cmp-details-notes'>": false;
            var notes_num = 0;
            if(notes){
                notes.forEach(function(v,i){
                    var t = JSON.parse(v);
                    var d = moment(t.timestamp).fromNow();
                    var l = moment(t.timestamp).format("MMMM Do [at] HH:mm");
                    notes_output += "<li data-num='"+notes_num+"'><span title='"+l+"'><a href='#' class='note-delete' data-ts='"+t.timestamp+"'><i class='fa fa-fw fa-trash' title='Delete entry'></i></a> "+d+"</span>"+escapeHtml(t.msg)+"</li>"; //data-toggle='tooltip' data-placement='left'
                    notes_num++;
                });
            }
            notes_output += notes_output ? "</ul>" : false;

            var output = "<li class='cmp-cmp list-group-item' data-dsp='"+data.dsp+"' data-dsp-id='"+data.dsp_id+"' data-adv-id='"+data.adv_id+"' data-par-id='"+data.par_id+"' data-priority='"+priority+"'>"+
            "<div class='d-flex align-items-center'>"+
                "<div class='pr-2'>"+
                    "<i class='fab fa-fw fa-"+icon+" mr-2'></i>"+
                "</div><div>"+
                    "<a href='#' class='cmp-row-link'>"+data.name+"</a>"+
                    "<br/><small class='text-muted text-sm'>"+data.dsp_id+(notes_num > 0 ? " | <a href='#' class='toggle-notes badge badge-pill badge-info'><i class='far fa-fw fa-comment'></i>&nbsp;"+notes_num+"</a>" : "")+"</small>"+
                "</div>"+
                "<div class='cmp-btns btn-group ml-auto'>"+
                    "<button type='button' class='btn btn-sm btn-outline-danger cmp-row-delete edittoggle hidden' data-toggle='tooltip' data-placement='bottom' title='Remove from Campaign'><i class='cursor-p fa fa-fw fa-trash'></i></button>"+
                    "<span class='btn btn-sm btn-outline-secondary cmp-row-priority edittoggle' data-toggle='tooltip' data-placement='bottom' title='Add details'><i class='fas fa-fw fa-thermometer-"+priority_a[priority]+"'></i></span>"+
                    //"<button type='button' class='btn btn-sm ml-1 btn-outline-success cmp-row-link' data-toggle='tooltip' data-placement='bottom' title='Visit this strategy'><i class='cursor-p fa fa-fw fa-external-link-square-alt'></i></button>"+
                "</div>"+
            "</div><div class='cmp-details'>"+(notes_output ? notes_output : "")+"</div></li>";
            $outEl.append(output);
        });

        //Tooltips
        $('[data-toggle="tooltip"]').tooltip();

        //Scroll back up to top
        $('.page').animate({ scrollTop: 0 }, 250);

        load(false);
    });
}

//Load all campaigns into list
function loadCampaigns(){
    chrome.storage.sync.get({"campaigns":[]}, function(o){
        load(true);
        var cmps = o.campaigns;
        var cmpdata = [];
        if(cmps.length>0){
            //Add to full list output
            var $o = $("#all-list");
            $o.html("");
            cmps.forEach(function(i,v){
                if(i!=null) {
                    cmpdata.push({id:v, text:i.name});

                    var notes = 0; var priority = 0;
                    var priority_a = ['empty', 'quarter', 'half', 'three-quarters', 'full'];

                    //Get length of campaign notes, average status
                    i.cmps.forEach(function(x,y){
                        priority += parseInt(x[0].priority) || 0;
                        notes += x[0].notes ? x[0].notes.length : 0;
                    });

                    priority = priority / cmps.length;
                    priority_acc = priority.toFixed(1).split('.')[1]!="0" ? priority.toFixed(1) : priority.toFixed(0);
                    priority = Math.ceil(priority);

                    var x =
                    "<li class='list-group-item d-flex align-items-center'>"+
                    //"<span class='badge badge-info badge-pill mr-2'>"+i.cmps.length+"</span>"+
                    "<i class='fas fa-fw fa-thermometer-"+priority_a[priority]+"' data-toggle='tooltip' data-placement='bottom' title='Priority "+priority_acc+"'></i>"+
                    "<i class='far fa-fw fa-comment"+(notes > 0 ? " colour-green' data-toggle='tooltip' data-placement='bottom' title='"+notes+" note"+(notes===1 ? "" : "s")+"'" : "'")+"></i>"+
                    "<div><a href='#' class='cmp-name' data-id='"+v+"'>"+i.name+"</a><small class='text-muted'>"+i.cmps.length+"</small></div>"+
                    "<div class='btn-group ml-auto'><button type='button' class='btn btn-sm btn-outline-danger cmp-delete' data-toggle='tooltip' data-placement='bottom' title='Delete Campaign'><i class='fa fa-fw fa-trash'></i></div>"
                    "</li>";
                    $o.append(x);
                }
            });
        }

        //Initialize select2
        // $('#info-cmp-search select').select2({ placeholder: 'No campaign selected', data: cmpdata });
        // $('#info-cmp-search select').on("select2:unselect", () => { $('#info-cmp-search select').on("select2:open", () => { $(".select2-search__field").val(""); }); });

        $('#navbar-search select').select2({ placeholder: 'No campaign selected', data: cmpdata });
        $('#navbar-search select').on("select2:unselect", () => { $('#info-cmp-search select').on("select2:open", () => { $(".select2-search__field").val(""); }); });

        // $('#closed-search-cont select').select2({ placeholder: 'Choose a campaign', data: cmpdata });
        // $('#closed-search-cont select').on("select2:unselect", () => { $('#info-cmp-search select').on("select2:open", () => { $(".select2-search__field").val(""); }); });

        //On campaign selection
        // $('#info-cmp-search select').on('select2:select', function (e) { selectCmp(e.params.data); });
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
            else if(cmpData.adv.data.par && v==='par' && d=="dbm") {
                //Get partner URL
                var parts = cmpData['adv'].url.split("/");
                var x = 0; var y = 0;
                var urlp = "https://displayvideo.google.com/"

                while(x < parts.length){
                    urlp += "/" + parts[x];
                    if(parts[x] == "p"){
                        y = parts[x+1];
                        urlp += "/" + parts[x+1];
                        break;
                    }
                    x++;
                }

                $('[data-info=par]').html(cmpData.adv.data.par).attr('data-href', urlp).attr('data-dsp', d).attr('data-dsp-id', y);
            }
        });

        if($("[data-info=cmp]").html()!="-") $(".cmp-add.collapse").addClass("show");
            else $(".cmp-add.collapse").removeClass("show");

        $("#info-page").show();

        load(false);
    }
}

//Save change to campaign name
function saveCmpName(){
    /*load(true);
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
    });*/

    load(true);
    var $el = $('#info-cmp-display');
    //$el.find('h5').show();
    //$el.find('input[data-input=name]').hide();

    var id = $('#info-cmp-display').attr('data-id');
    var nt = $el.find('input[data-input=name]').val();

    chrome.storage.sync.get({"campaigns":[]}, function(o){
        var cmps = o.campaigns;
        cmps[id].name = nt;
        chrome.storage.sync.set({"campaigns":cmps});
        $el.find('h5').html(nt);
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
    loadCampaigns();
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

//Delete note (requires cmpid, dspid, ts (note timestamp))
function deleteNote(data){
    load(true);
    var a = data.dspid;
    var b = data.cmpid;
    var c = data.ts;

    chrome.storage.sync.get({"campaigns":[]}, function(o){
        var cmps = o.campaigns;
        var BreakException = {};

        try {
            //Find overall object
            cmps[b].cmps.forEach(function(v,i){
                if(v[0].dsp_id==a){
                    v[0].notes.forEach(function(x,y){
                        if(JSON.parse(x).timestamp==c){
                            //Note found
                            var n = v[0].notes;
                            n.splice(y,1);

                            cmps[b].cmps[i][0].notes = n;
                            chrome.storage.sync.set({"campaigns":cmps});
                            refreshThisCmp();
                            throw BreakException;
                        }
                    })
                }
            });
        } catch(e){
            if(e !== BreakException) throw e;
        }
    });
}

//Refresh optimizations list
function refreshNotes(){
    //Get full list of notes
    chrome.storage.sync.get({"campaigns":[]}, function(o){
        var notes = [];
        var cmps = o.campaigns;
        cmps.forEach(function(v,i){
            if(( v !== null ) && ( v.cmps !== null )) {
                v.cmps.forEach(function(a,b){
                    if((a[0].notes !== null) && (a[0].notes !== undefined) && (a[0].notes.length > 0)){
                        a[0].notes.forEach(function(c,d){
                            var n = JSON.parse(c);
                            n['cmp'] = v.name;
                            n['obj'] = a[0].name;
                            notes.push(n);
                        })
                    }
                });
            }
        });

        //Sort newest > oldest
        notes.sort(function(a,b){
            if(a.timestamp > b.timestamp) return -1;
            else if(a.timestamp < b.timestamp) return 1;
            else return 0;
        });

        //Append to list element
        var x = "";
        notes.forEach(function(v,i){
            var d = moment(v.timestamp).format("MMMM Do");

            if(d!==x){
                x = d;
                $("#opt-list").append("<li class='sep-date' data-ts='"+v.timestamp+"'>"+d+"</li>");
            }

            $("#opt-list").append("<li data-note='"+escapeHtml(v.msg)+"' data-ts='"+v.timestamp+"' data-date='"+moment(v.timestamp).format("DD/MM/YYYY")+"' data-time='"+moment(v.timestamp).format("HH:mm")+"'>"+
                "<div class='msg'>"+
                    "<span class='ts'>"+moment(v.timestamp).format("HH:mm")+"</span>"+
                    v.msg+
                "</div>"+
                "<div class='meta' data-cmp='"+escapeHtml(v.cmp)+"' data-obj='"+escapeHtml(v.obj)+"'>"+
                    "<span>"+v.obj+"</span><br>"+
                    "("+v.cmp+")"+
                "</div>"+
            "</li>");
        });

    });
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

//Escape/unescape
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/'/g, "&#039;")
        .replace(/"/g, "&quot;");
}

function unescapeHtml(safe) {
    return safe
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
}

//Version comparison
function versionCompare(v1, v2, options) {
    var lexicographical = options && options.lexicographical,
        zeroExtend = options && options.zeroExtend,
        v1parts = v1.split('.'),
        v2parts = v2.split('.');

    function isValidPart(x) {
        return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
    }

    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) return NaN;

    if (zeroExtend) {
        while (v1parts.length < v2parts.length) v1parts.push("0");
        while (v2parts.length < v1parts.length) v2parts.push("0");
    }

    if (!lexicographical) {
        v1parts = v1parts.map(Number);
        v2parts = v2parts.map(Number);
    }

    for (var i = 0; i < v1parts.length; ++i) {
        if (v2parts.length == i) return 1;
        if (v1parts[i] == v2parts[i]) continue;
        else if (v1parts[i] > v2parts[i]) return 1;
        else return -1;
    }

    if (v1parts.length != v2parts.length) return -1;

    return 0;
}

//Download user saved campaign data
function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function exportAll(){
    chrome.storage.sync.get(null, function(i){
        download("NeatDSP-export-"+moment(new Date()).format("YYYYMMDD-HHmm")+".txt", JSON.stringify(i));
    });
}

function exportOpt(){
    var output = [['Timestamp','Date','Time','Campaign','Object','Note']];
    $("#opt-list li:not(.sep-date)").each(function(){
        var $t = $(this);
        output.push([
            $t.attr('data-ts'),
            $t.attr('data-date'),
            $t.attr('data-time'),
            $t.find(".meta").attr('data-cmp'),
            $t.find(".meta").attr('data-obj'),
            '"'+$t.attr('data-note').replace(/\"/g,"'")+'"'
        ]);
    });

    csv = "";
    output.forEach(function(v,i){
        csv += v.join(",") + "\n";
    });

    download("NeatDSP-Optimizations-"+moment(new Date()).format("YYYYMMDD-HHmm")+".csv", csv);
}
