var app_id = '167160903315323';
var api_key = '60ceb336658310ccd55d430a0cd1e6dd';
var controller = null;
var graph = null;

function Controller(){
    this.init = function(){
        
        // load the access token from cookie if it exists
        $('#access_token').attr('value', $.cookie('access_token'));

        // handle the click to clear the access token
        $('#clear_access_token').click(function(){
            $.cookie('access_token', null);
            $('#access_token').attr('value', '');
        })
        
        // handle clicks on the tabs
        $('#tabs ul li a').click(function(e){
            e.preventDefault();
            var clicked = $(e.target);
            if($(clicked).hasClass('fql')){
                if (window.location.hash.substring(0,4)!='#FQL'){
                    window.location.hash = 'FQL';
                }
            } else {
                if (window.location.hash.substring(0,4)=='#FQL'){
                    window.location.hash = '';
                }
            }
            return false
        })
        
        // listen for method select change events
        $('#select_method').change(function(){
            var method = $(this).attr('value');
            if (method=='POST') controller.showFields();
            else controller.hideFields();
        })
        
        // handle request form submission
        $('#request_form').submit(function(){
          controller.buildRequest();
          return false;
        });
        
        // handle fql form submission
        $('#fql_form').submit(function(){
          controller.buildFqlRequest();
          return false;
        });
        
        $('#fql-examples ul li a').live('click', function(e){
          var query = $('span', e.target).html();
          controller.runFqlExample(query);
          return false;
        })
        
        // listen for clicks to add more fields to the post form
        // handle request form submission
        $('#post_fields ul li a.add_field').live('click', function(){
            controller.addField();
            return false;
        });
        // and to remove them
        $('#post_fields ul li a.remove_field').live('click', function(e){
            controller.removeField(e);
            return false;
        });
        
        // handle clicks on links in the response panels
        $('#response a, #connections a').live('click', function(e){
            var url = $(this).attr('href');
            if(isGraphUrl(url)){
                e.preventDefault();
                // open in this test harness
                window.location.hash = 'GET!'+url;
                return false;
            }else{
                //open in new window or tab
                $(this).attr('target', "_blank");
                return true;
            }

        })
        
    }; // END INIT
    
    this.postParamsFromForm = function(){
        var params = {};
        $('#post_fields li.post_field').each(function(){
            var fieldname = $('select:first', this).attr('value');
            var fieldvalue = $('input', this).attr('value');
            if(fieldname && fieldvalue){
                params[fieldname] = fieldvalue;
            }
        })
        
        return params;
    }
    
    this.buildRequest = function(){
        
        var oldhash = window.location.hash.substr(1);
        
        var method = this.getMethod();
        var newhash = method;
        var path = this.getPath();
        url = "https://graph.facebook.com/"+path;
        if (method == 'GET') {
            newhash += "!"+url
            if (newhash == oldhash){
                // has hasn't changed, but form has been submitted, resubmit anyway
                this.hashChange(newhash)
            } else {
                // just push the new data into the hash
                window.location.hash = newhash;
            }
        } else {
            // form method was not a GET
            window.location.hash = method;
            if(method == 'POST') {
                var params = this.postParamsFromForm();
                graph.request(url, "POST", params);
            } else {
                graph.request(url, method, {});
            }
            
        }
    }
    
    this.buildFqlRequest = function(){
        var fqlquery = $('#fql_query').attr('value');
        window.location.hash = "FQL!"+escape(fqlquery);
    }
    
    this.runFqlExample = function(query){
        $('#fql_query').attr('value', query);
        $('#fql_query').submit();
    }
    
    this.authCallback = function(hash){
        var access_token = hash.substr(1).split('&')[0].split('=')[1]
        if(access_token){
            var expire = new Date();
            // expire the access token in an hour
            expire.setHours(expire.getHours() + 1)
            $.cookie('access_token', access_token,{
                expires: expire
            });
            $('#access_token').attr('value', access_token);
        }
    };
    
    this.hashChange = function(hash){
        //console.log(hash)
        var method = hash.split('!')[0];
        var url = hash.split('!')[1];
        
        if (method == 'FQL') {
            // switch tabs to FQL Query
            $('#request-panel').fadeOut('fast',function(){
                $('#fql-panel').fadeIn('fast');
            });
            $('#tabs ul li a').removeClass('active');
            $('#tabs ul li a.fql').addClass('active');
            if(url) {
                graph.fqlRequest(url);
            }
            return; // all done.
        }

        // switch tabs to Graph Request
        $('#fql-panel').fadeOut('fast',function(){
            $('#request-panel').fadeIn('fast');
        });
        $('#tabs ul li a').removeClass('active');
        $('#tabs ul li a.graph').addClass('active');
        
        // method or URL will be empty on load - do nothing.
        if (!method) return false;

        // set the form state, and make the request!
        this.setMethod(method);
        
        if (!url) return false;
        this.setPath(url.match(/^https:\/\/graph.facebook.com\/(.*)/)[1]);
        graph.request(url, method, {})
        
    };
    
    this.showFields = function() {
        $('#post_fields').slideDown()
    };
    this.hideFields = function() {
        $('#post_fields').slideUp()
    }
    this.getMethod = function() {
        return $('#select_method').attr('value');
    };
    this.getPath = function() {
        return $('#request_url').attr('value');
    }
    this.setMethod = function(method) {
        if (method == 'GET') {
            $('#select_method').attr('value', 'GET').trigger('change');
            return true;
        } else if (method == 'POST') {
            $('#select_method').attr('value', 'POST').trigger('change');
            return true;
        } else if (method == 'DELETE') {
            $('#select_method').attr('value', 'DELETE').trigger('change');
            return true;
        } else {
            return false;
        }
    };
    this.setPath = function(path) {
        $('#request_url').attr('value', path);
        return true
    };
    this.addField = function() {
        if($('#post_fields ul li.post_field:first').css('display') != 'none' ) {
            // copy the one which already exists in the dom
            var newfield = $('#post_fields ul li:last').prev().clone();
            $('input', newfield).attr('value', '')
            $(newfield).insertBefore('#post_fields ul li:last').show();
        } else {
            // show the hidden one
            $('#post_fields ul li.post_field input').attr('value', '')
            $('#post_fields ul li.post_field').show()
        }

    }
    this.removeField = function(e) {
        var fieldcount = $('#post_fields ul li.post_field').length;
        if (fieldcount > 1) {
            $(e.target).parent().remove();
        } else {
            $('#post_fields ul li.post_field:first').hide()
        }
    }
    
    
}

function Graph(){
    
    this.showConnections = function(connections){
        $('#connections').html('<ul></ul>')
        for (i in connections) {
            var url = connections[i]
            url = url.split("?")[0];
            //var newurl = $.query.load(url).set('access_token', null).toString();
            var connection = $('<li><a href="'+url+'">'+i+'</a></li>');
            $('#connections ul').append(connection);
        }
    }

    this.showFields = function(fields){
        $('#fields').html('<dl></dl>')
        for (i in fields) {
            var connection = $('<dt>'+fields[i]['name']+'</dt><dd>'+fields[i]['description']+'</dd>');
            $('#fields dl').append(connection);
        }
    }
    
    this.fqlRequest = function(query){
        if (!query) return false;
        
        var data = {};
        data['format'] = 'json';
        data['query'] = unescape(query);
        
        // use a user access_token if we have one...
        var access_token = $('#access_token').attr('value');
        if(access_token != '') {
            data['access_token'] = access_token;
        }

        var that = this;
        
        $('#response').removeClass('error');
        $('#response').addClass('loading');
        $('#response-meta').hide();
        $.ajax({
            url: 'https://api.facebook.com/method/fql.query?callback=?',
            data: data,
            type: 'GET',
            dataType: 'jsonp',
            success: function(rsp, status, e) {
                $('#response').removeClass('loading');
                if (rsp.error_code){
                    $('#response').addClass('error');
                } else {

                }
                var jsonAsHtml = object2html(rsp);
                $('#response').html(jsonAsHtml);
            }
        });
        
    }
    
    this.printHeaders = function(headers_raw){
        headers = headers_raw.split('\n');
        $('#headers').append('<dl></dl>');
        for (i in headers){
            if (headers[i]){
                var split = headers[i].split(': ');
                $('#headers dl').append('<dt>'+split[0]+'</dt><dd>'+split[1]+'</dd>');
            }
        }
    }
    
    this.request = function(url, method, params){
        var path = url.replace("https://graph.facebook.com/","");
        if (!path || path == '') return false;
        var data = {}
        if (params) {
            data = params;
        }
        
        if (method == 'GET'){
            data.metadata = 1;
        };
        
        // use a user access_token if we have one...
        var access_token = $('#access_token').attr('value');
        if(access_token != '') {
            data['access_token'] = access_token;
        }

        var that = this;
        
        $('#response').removeClass('error');
        $('#response').addClass('loading');
        $('#connections, #fields, #headers').empty();
        $('#response-meta').show();
        $.ajax({
            url: 'https://www.simoncross.com/fb/graph/proxy/'+path,
            data: data,
            type: method,
            dataType: 'json',
            success: function(rsp, status, e) {
                graph.printHeaders(e.getAllResponseHeaders());
                $('#response').removeClass('loading');
                if(rsp.metadata) {
                    var metadata = rsp.metadata;
                    that.showConnections(metadata.connections);
                    that.showFields(metadata.fields);
                    rsp.metadata = null;
                }
                if(rsp.name) {
                    document.title = rsp.name;
                } else if (rsp.message){
                    document.title = rsp.message;
                } else {
                  document.title = $('h1').html()  
                }
                var jsonAsHtml = object2html(rsp);
                $('#response').html(jsonAsHtml);
                //logHttpResponse(request_id);
            },
            error: function(e){
                $('#response').addClass('error');
                $('#response').removeClass('loading');
                var rsp = JSON.parse(e.responseText);
                var statuscode = e.status;
                var jsonAsHtml = object2html(rsp);        
                $('#response').html(jsonAsHtml);
                //logHttpResponse(request_id, statuscode);
            }
        });
    }
    
}

$(document).ready(function(){
    
    controller = new Controller()
    controller.init();
    
    graph = new Graph();
    
    // by default, make links and forms not change the page
    $('form').submit(function(e){
        e.preventDefault();
        //return false;
    })
    $('a').click(function(e){
        e.preventDefault();
        //return false;
    })
    

    
    // setup jquery history to handle hashchange events
    $.history.init(function(hash){
        controller.hashChange(hash);
    });
  
  // start the auth process by building a URL
  $('#start_auth').click(function(){
    //clear cookie and form  
    $.cookie('access_token', null);
    $('#access_token').attr('value', '');
    
    var auth_url = 'http://www.facebook.com/dialog/oauth/'
    auth_url += '?response_type=token&display=popup&client_id='+app_id+'&redirect_uri=https://www.simoncross.com/fb/graph/callback.html';
    var scope = '';
    $('form#perms input').each(function(){
      var elem = $(this);
      if(elem.attr('checked')){
        scope += elem.attr('name')+','
      };
    })
    if (scope != ''){
      auth_url += '&scope='+scope
    }
    window.open(auth_url,'authwindow','width=600,height=350');
    return false;
  })
  
  // show/hide perms on click
  $('#toggle_perms').click(function(){
      $('form#perms').slideToggle()
  })
  

  

}) // end document ready


function isGraphUrl(url){
    if(url.match(/:\/\/graph.facebook.com\//)==null) return false;
    else return true;
}

// used to print json objects to the screen in a sexy sexy way
function object2html(obj, level){
    if (!level) level = 0; // default to 0
    var html = '';
    if (level==0){
        html += '{'
    }
    for (key in obj){
        if (key != 'metadata'){
        
            var val = obj[key];
            html += '\n';
        
            // indenting
            var i = 0;
            var indent = '';
            for (i=0;i<=level;i++){
                indent += '  ';
            }
            html += indent;
        
            if(typeof(val) == "object"){
                if (val instanceof Array){
                    // an array of objects, run this function on each array entry
                    html += key+': ['
                    for (j in val){
                        html += '\n'+indent+'  {';
                        html += object2html(val[j], level+2);
                        html += '\n'+indent+'  },'; 
                    }
                    html += '\n'+indent+']';
                }else{
                    // recursively run this function
                    html += key+': {'
                    html += object2html(val, level+1);
                    html += '\n'+indent+'},';  
                }
            }else{
                // standard kv pair
                html += key+': ';
                if (typeof val == 'number'){
                    html += '<span class="int">'+val+'</span>';
                } else if (typeof val == 'boolean'){
                    if (val) html += '<span class="bool">true</span>';
                    else html += '<span class="bool">false</span>';
                }else if (typeof val == 'string'){

                    // hack hackety hack hack
                    val = htmlentities(val)
                    
                    // make links clickable
                    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/i;
                    val = val.replace(exp,"<a href='$1'>$1</a>");
                    if (key == 'id'){
                        val = '<a href="https://graph.facebook.com/'+val+'">'+val+'</a>';
                    }
                    
                    html += '<span class="string">"'+val+'"</span>';  
                }
                html += ',';
            }
        }
    }
    if (level==0){
        html += '\n}'
    }
    return html;
}

//erugh...
function htmlentities(str){
    str = str.replace(/&/g, "&amp;");
    str = str.replace(/</g, "&lt;");
    str = str.replace(/>/g, "&gt;");
    return str;
}



function isInt(x){
    var y=parseInt(x);
    if (isNaN(y)) return false;
    return x==y && x.toString()==y.toString();
}
