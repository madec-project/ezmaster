$(function () {
  var getTechnicalName = function getTechnicalName() {
    var tcp1 = $('#technicalName_part1').val();
    var tcp2 = $('#technicalName_part2').val();
    var tcp3 = $('#technicalName_part3').val();
    return tcp1+'_'+tcp2+ (tcp3.length?'_'+tcp3:'');
  };

  var data = [];

  //////////////////////////////
  $.ajax({
    url: "/instance/list.json?updatable=true"
  })
  .done(function (list) {
    if (list === undefined) {
      console.log('adrs:', list);
      alert('Error: the data server is not responding');
      return;
    }

    if (!list || list.length === 0) {
      console.log(list);
      alert('Erreur: the data table is empty');
      return false;
    }
    var i = 0;
    for(var id in list) {
      data[i++] = {
        id: i,
        title: list[id].title,
        port: list[id].port,
        technicalName: id,
        app: list[id].app || "",
        date: list[id].date || new Date()
      };
    }

    // Insert instances into the HTML table
    var tableBody = $('#instances tbody');
    data.forEach(function (instance, index, instances) {
      var url = window.location.href.replace(config.port, instance.port);
      tableBody.append(
        '<tr>' +
        '<td>' + instance.title + '</td>' +
        '<td>' + instance.port +
          ' <a href="' + url + '" target="_blank">' +
          '<span class="status glyphicon glyphicon-link" title="Go to the instance"></span>' +
          '</a>' + '</td>' +
        '<td>' + instance.technicalName + '</td>' +
        '<td>' + instance.date + '</td>' +
        '<td>' + instance.app + '</td>' +
        '<td>' +
          '<span class="status icon-remove glyphicon glyphicon-remove actionsButtons  btn-xs" data-id="' + instance.technicalName + '" title="' + instance.technicalName + ' stopped"></span> ' +
          '<a class="status-toggle btn btn btn-xs actionsButtons" data-id="' + instance.technicalName + '" data-status="stopped" title="Run ' + instance.technicalName + '"><span class="glyphicon glyphicon-play"></span></a> ' +

          '<span class="status icon-ok glyphicon glyphicon-ok actionsButtons btn-xs" data-id="' + instance.technicalName + '" title="' + instance.technicalName + ' running" style="display:none"></span> ' +
          '<a class="status-toggle btn btn-xs actionsButtons" data-id="' + instance.technicalName + '" data-status="running" title="Stop ' + instance.technicalName + '" style="display:none"><span class="glyphicon glyphicon-pause"></span></a> ' +

          '<a class="settings btn btn-xs actionsButtons" data-id="' + instance.technicalName + '" title="Edit settings of ' + instance.technicalName + '" data-toggle="modal" data-target="#settingsEditor"><span class="glyphicon glyphicon-cog"><span></a>' +

          '<a href="/upload/' + instance.technicalName + '"' +
          ' class="upload-button btn btn-xs actionsButtons" >  <span class="glyphicon glyphicon-download-alt"></span></a> ' +

          '<a  href="#deleteModal"' +
          ' data-toggle="modal" data-id="' + instance.technicalName + '"' +
          ' class="delete-button btn btn-xs actionsButtons"> <span class="glyphicon glyphicon-trash"></span></a> ' + '</td>' +
        '</tr>');
    });

    // Settings //
    var editor;
    var warnClose = function warnClose() {
      $('#settings-cancel-button').addClass('btn-warning');
      try {
        var e = editor.get();
        $('#settings-save-button').removeClass('disabled');
        $('messageEditWarning').text('');
        $('#editDivWarning').css('opacity' , '0');
      }
      catch (e) {
        $('#messageEditWarning').text(e.message);
        $('#editDivWarning').css('opacity' , '1');
        $('#settings-save-button').addClass('disabled');
      }
    };
    var normalClose = function normalClose() {
      $('#settings-cancel-button').removeClass('btn-warning');
      $('#settings-save-button').removeClass('disabled');
    };
    var jseOptions = {
      name: "No instance selected",
      mode: "tree",       // tree (default), view, form, text, code
      change: warnClose
    };
    var edContainer = document.getElementById('settingsEditorDiv');
    editor = new JSONEditor(edContainer,jseOptions);

    $('.settings').click(function (e) {
      "use strict";
      var id = $(this).data().id;
      $('.table tbody tr').removeClass('highlighted');
      $(this).parent().parent().addClass('highlighted');
      // Instances settings are in var list.
      var settings = Object.clone(list[id]);
      delete settings.id;
      delete settings.collectionName;
      delete settings.data_path;
      delete settings.date;
      delete settings.port;
      delete settings.users;
      delete settings.connexionURI;
      delete settings.turnoffAll;
      delete settings.app;
      editor.set(settings);
      editor.setName(id);
      $('#settingsEditor').show();
      normalClose();
    });

    $('#settings-save-button').click(function (e) {
      var id = editor.getName();
      var newSettings = editor.get();
      newSettings.id = list[id].id;
      newSettings.collectionName = list[id].collectionName;
      newSettings.data_path = list[id].data_path;
      newSettings.date = list[id].date;
      newSettings.port = list[id].port;
      newSettings.users = list[id].users;
      newSettings.connexionURI = list[id].connexionURI;
      newSettings.turnoffAll = list[id].turnoffAll;
      newSettings.app = list[id].app;
      var putting = $.ajax({
        url: '/instance/' + id,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(newSettings)
      });
      // Action done
      putting.done(function (data) {
        displayStatus(id, !newSettings.turnoffAll);
        list[id] = newSettings;
        normalClose();
        $('#settingsEditor .modal-content').css('border' ,'4px solid green').delay(900).queue(function(next){
            $('#settingsEditor').modal('hide');
            $(this).css('border' ,'');
            next();
        });
      });
      putting.fail(function (err) {
        console.error(err);
        var errText = err.responseText.split("\n")[0] + ' (' + err.statusText +')';
        if (err.status === 403 || err.status === 400) {
          errText = err.responseText;
          var op = errText.indexOf('<p>');
          var cp = errText.indexOf('</p>');
          errText = errText.substring(op + 3, cp);
          console.error(op, cp, errText);
        }
        alert(errText);
      });
    });

    $('#mode-text-button').click(function (e) {
      editor.setMode('code');
      $('#mode-text-button').hide();
      $('#mode-tree-button').show();
    });

    $('#mode-tree-button').click(function (e) {
      editor.setMode('tree');
      $('#mode-text-button').show();
      $('#mode-tree-button').hide();
    });

    $('#settings-cancel-button').click(function (e) {
      $('.table tbody tr').removeClass('highlighted');
    });

    // Statuses //
    /**
     * Change the status of an instance depending whether it is running or not
     * @param  {String}  id      Identifier of the instance
     * @param  {Boolean} running true if running
     */
    var displayStatus = function (id, running) {
      if (running) {
        $('.status-toggle[data-id="' + id + '"][data-status="stopped"]').hide();
        $('.status-toggle[data-id="' + id + '"][data-status="running"]').show();

        $('.status[data-id="' + id + '"].icon-remove').hide();
        $('.status[data-id="' + id + '"].icon-ok').show();
      }
      else {
        $('.status-toggle[data-id="' + id + '"][data-status="running"]').hide();
        $('.status-toggle[data-id="' + id + '"][data-status="stopped"]').show();

        $('.status[data-id="' + id + '"].icon-ok').hide();
        $('.status[data-id="' + id + '"].icon-remove').show();
      }
    };
    // Initialize statuses
    data.forEach(function (instance) {
      var id = instance.technicalName;
      displayStatus(id, !(list[id].turnoffAll));
    });

    // Stop/start buttons and status
    var stop = function stop(e) {
      var id          = $(this).data().id;
      var json        = list[id];
      json.turnoffAll = true;
      var putting = $.ajax({
        url: '/instance/' + id,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(json)
      });
      // Action done
      putting.done(function (data) {
        displayStatus(id, false);
      });
      putting.fail(function (err) {
        console.error(err);
        var errText = err.responseText.split("\n")[0] + ' (' + err.statusText +')';
        if (err.status === 403 || err.status === 400) {
          errText = err.responseText;
          var op = errText.indexOf('<p>');
          var cp = errText.indexOf('</p>');
          errText = errText.substring(op + 3, cp);
          console.error(op, cp, errText);
        }
        alert(errText);
      });
    };
    var start = function start(e) {
      var id          = $(this).data().id;
      var json        = list[id];
      json.turnoffAll = false;
      var putting = $.ajax({
        url: '/instance/' + id,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(json)
      });
      // Action done
      putting.done(function (data) {
        displayStatus(id, true);
      });
      putting.fail(function (err) {
        console.error(err);
        var errText = err.responseText.split("\n")[0] + ' (' + err.statusText +')';
        if (err.status === 403 || err.status === 400) {
          errText = err.responseText;
          var op = errText.indexOf('<p>');
          var cp = errText.indexOf('</p>');
          errText = errText.substring(op + 3, cp);
          console.error(op, cp, errText);
        }
        alert(errText);
      });
    };
    $('.status-toggle[data-status="running"]').click(stop);
    $('.status-toggle[data-status="stopped"]').click(start);
    // Reinitialize form depending on button (create or modify)
    $('#create-button').click(function (e) {
      $('#title').focus();
      $('#create-instance-form')[0].reset();
      $('#technicalName').attr('disabled');
      $('#technicalName_part1').removeAttr('disabled');
      $('#technicalName_part2').removeAttr('disabled');
      $('#technicalName_part3').removeAttr('disabled');
      $('#technicalName_part1').removeClass('hidden');
      $('#technicalName_part2').removeClass('hidden');
      $('#technicalName_part3').removeClass('hidden');
      $('#part1').removeClass('hidden');
      $('#part2').removeClass('hidden');
      $('#part3').removeClass('hidden');
      $('#create-submit-button').attr('disabled', 'disabled');
      $('#url').addClass('hidden');
      $('#internal_url').addClass('hidden');
      $('#date').addClass('hidden');
      $('#create-submit-button').text('Create');
      $('#createModalLabel').text('Create an instance');
    });
    // Control inputs
    $('#technicalName_part1, #technicalName_part2, #technicalName_part3').keyup(function (e) {

      var t = e.currentTarget;
      if(!t.validity.valid && !t.validity.valueMissing) {
        $('#' + t.id + ' + .validMessage').show();
        $('#' + t.id).css('border-color' , 'red');
      }
      else {
        $('#' + t.id + ' + .validMessage').hide();
        $('#' + t.id).css('border-color' , '');
      }

      var tcp1 = $('#technicalName_part1').val();
      var tcp2 = $('#technicalName_part2').val();
      var tcp3 = $('#technicalName_part3').val();
      var alphanum = /^[a-z0-9]+$/;
      var numrik = /^[0-9]+$/;
      var technicalName = getTechnicalName();
      if (config.domain) {
        $('#url').val('http://'+technicalName+'.'+config.domain);
      }
      if ((tcp1.match(alphanum)) && (tcp2.match(alphanum)) && (tcp3.match(numrik) || tcp3.length === 0)) {
        $('#create-submit-button').removeAttr('disabled');
      }
      else {
        $('#create-submit-button').attr('disabled', 'disabled');
      }
    });


    // Modify delete button behavior: update deleteModal
    $('.delete-button').click(function (e) {
      var thisid = $(this).data().id; // e.target.dataset.id
      $('#deleteModalId').text(thisid);
      $.ajax({
        url: "/instance/" + thisid + "/volume.json"
      })
      .done(function (volume) {
        $('#deleteModalVolume').text(volume.size);
      })
      .error(function (jqXHR) {
        alert(
          'Erreur : the data server returned an error (' +
          jqXHR.status + ' : ' + jqXHR.statusText + ')'
        );
        console.error(jqXHR);
      });
    });


  }).error(function (jqXHR) {
    alert(
      'Erreur : the data server returned an error (' +
      jqXHR.status + ' : ' + jqXHR.statusText + ')'
    );
    console.error(jqXHR);
  });


  // POST form in Ajax
  $('#create-instance-form').submit(function (event) {
    // Stop form from submitting normally
    event.preventDefault();
    // Get the form data
    var $form = $(this),
        title = $('#title').val(),
        app = $('#app').val(),
        //technicalName = $('#technicalName').val(),
        technicalName = getTechnicalName();
        accel = $('#accel').val();
        date = $('#date_input').val();
        users = null;

    // var newUsers = (users[0].email ? users : null);
    var newUsers = null;
    // Send the data using post
    var posting = $.post('/instance/', {
      title: title,
      technicalName: technicalName,
      accel: accel,
      date: date,
      app: app,
      tblAppendGrid: newUsers
    });
    // Action done
    posting.done(function (data) {
      // success: display the created item in the instances list
      if (data === 'Created') {
        window.location.href = '/';
      }
    });
    posting.fail(function (err) {
      console.error(err.responseText);
      var errText = err.responseText.split("\n")[0];
      if (err.status === 403 || err.status === 400) {
        errText = err.responseText;
        var op = errText.indexOf('<p>');
        var cp = errText.indexOf('</p>');
        errText = errText.substring(op + 3, cp);
        console.error(op, cp, errText);
      }
      alert(errText);
    });
  });

  // DELETE form in Ajax
  $('#delete-instance-form').submit(function (event) {
    // Stop form from submitting normally
    event.preventDefault();
    // Get the form data
    var $form = $(this),
        id = $("#deleteModalId").text();
    // Send the data using delete
    var deleting = $.ajax({
      url: '/instance/' + id,
      type: 'DELETE'
    });
    // Action done
    deleting.done(function (data) {
      // success: display the created item in the instances list
      window.location.href = '/';
    });
    deleting.fail(function (err) {
      console.error(err);
      var errText = err.responseText.split("\n")[0] + ' (' + err.statusText +')';
      if (err.status === 403 || err.status === 400) {
        errText = err.responseText;
        var op = errText.indexOf('<p>');
        var cp = errText.indexOf('</p>');
        errText = errText.substring(op + 3, cp);
        console.error(op, cp, errText);
      }
      alert(errText);
    });
  });

  if (!config.domain) {
    $('.input-group #url').parent().hide();
  }
});