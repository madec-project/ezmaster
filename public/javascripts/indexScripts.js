$(function () {

  // Initialize SlickGrid (instances list)
  var portFormatter =
    function portFormatter (row, cell, value, columnDef, dataContext) {
      var url = window.location.href.replace(config.port, dataContext.port);
      var str = value + ' <a href="' + url + '" target="_blank">' +
                '<span class="status glyphicon glyphicon-link"  title="Go to the instance" ></span>' +
                '</a>';
      return str;
    };

  var actionFormatter =
    function ActionFormatter(row, cell, value, columnDef, dataContext) {
        var ref = dataContext.technicalName;
        return  '<span class="status icon-remove glyphicon glyphicon-remove actionsButtons  btn-xs" data-id="' + ref + '" title="' + ref + ' stopped"></span> ' +
                '<a class="status-toggle btn btn btn-xs actionsButtons" data-id="' + ref + '" data-status="stopped" title="Run ' + ref + '"><span class="glyphicon glyphicon-play"></span></a> ' +

                '<span class="status icon-ok glyphicon glyphicon-ok actionsButtons btn-xs" data-id="' + ref + '" title="' + ref + ' running" style="display:none"></span> ' +
                '<a class="status-toggle btn btn-xs actionsButtons" data-id="' + ref + '" data-status="running" title="Stop ' + ref + '" style="display:none"><span class="glyphicon glyphicon-pause"></span></a> ' +

                '<a class="settings btn btn-xs actionsButtons" data-id="' + ref + '" title="Edit settings of ' + ref + '" data-toggle="modal" data-target="#settingsEditor"><span class="glyphicon glyphicon-cog"><span></a>' +

                '<a href="/upload/' + ref + '"' +
                ' class="upload-button btn btn-xs actionsButtons" >  <span class="glyphicon glyphicon-download-alt"></span></a> ' +

                '<a  href="#deleteModal"' +
                ' data-toggle="modal" data-id="' + ref + '"' +
                ' class="delete-button btn btn-xs actionsButtons"> <span class="glyphicon glyphicon-trash"></span></a> '
                ;
    };

  var columns = [
    {id:"title", name:"Title", field:"title", sortable:true},
    {id:"port", name:"Port", field:"port", sortable:true, formatter: portFormatter},
    {id:"technicalName", name:"Technical name", field:"technicalName", sortable:true},
    {id:"date", name:"Creation date", field:"date", sortable:true},
    {id:"actions", name: "Actions", field: "actions", formatter: actionFormatter/*, width: 1*/}
  ];

  var options = {
    autoEdit: false,
    editable: true,
    // asyncEditorLoading: true,
    forceFitColumns: true,
    // topPanelHeight: 25,

    multiColumnSort: true,
    enableColumnReorder: false,
    enableCellNavigation: true,
    showHeaderRow: true,
    headerRowHeight: 30,
    explicitInitialization: true
  };

  var columnFilters = {};
  var data = [];
  var makeButtons = function makeButtons() {
    $('.upload-button').button({icons: { primary: 'glyphicon glyphicon-download-alt' }, text: false});
    // $('.modify-button').button({icons: { primary: 'ui-icon-pencil' }, text: false});
    $('.delete-button').button({icons: { primary: 'ui-icon-trash' }, text: false});
  };

  function filter(item) {
    for (var columnId in columnFilters) {
      if (columnId !== undefined && columnFilters[columnId] !== "") {
        var column = grid.getColumns()[grid.getColumnIndex(columnId)];
        var str = columnFilters[columnId];
        var tab = str.split(' ');
        if (item[column.field]) {
          if (item[column.field] == "") {
            return false;
          }

          return tab.every(function isInColumn(s) {
            return String(item[column.field]).toUpperCase().indexOf(s.toUpperCase()) !== -1;
          })

        }
      }
    }
    return true;
  }

  //////////////////////////////
  $.ajax({
    url: "/instance/list.json?updatable=true"
  })
  .done(function (list) {
    if (list === undefined) {
      console.log('adrs:', list);
      alert('Error: the data server is not responding');
    } else {
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
          date: list[id].date || new Date()
        }
      }
      dataView = new Slick.Data.DataView({ inlineFilters: false });
      dataView.setItems(data);
      dataView.setFilter(filter);
      grid = new Slick.Grid($("#myGrid"), dataView, columns, options);
      grid.setSelectionModel(new Slick.RowSelectionModel({selectActiveRow: false}));

      dataView.onRowCountChanged.subscribe(function (e, args) {
        grid.updateRowCount();
        grid.render();
      });

      dataView.onRowsChanged.subscribe(function (e, args) {
        grid.invalidateRows(args.rows);
        grid.render();
        makeButtons();
      });

      $(grid.getHeaderRow()).delegate(":input", "change keyup", function (e) {
        var columnId = $(this).data("columnId");
        if (columnId != null) {
          columnFilters[columnId] = $.trim($(this).val());
          dataView.refresh();
        }
      });

      grid.onHeaderRowCellRendered.subscribe(function(e, args) {
          $(args.node).empty();
          $("<input type='text'>")
             .data("columnId", args.column.id)
             .val(columnFilters[args.column.id])
             .appendTo(args.node);
      });

      grid.init();
      makeButtons(); // convert <a>s into JQuery-UI icon buttons.


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
        $('.slick-row').removeClass('highlighted');
        $(this).parent().parent().addClass('highlighted');
        // console.info('settings ' + id);
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
        $('.slick-row').removeClass('highlighted');
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
      })

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
        })
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
        })
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
      // $('.modify-button').click(function (e) {
      //   var thisid = $(this).data().id; // e.target.dataset.id
      //   $('#url').removeClass('hidden');
      //   $('#internal_url').removeClass('hidden');
      //   $('#date').removeClass('hidden');
      //   $('#create-submit-button').text('Modify');
      //   $('#createModalLabel').text('Modify an instance');
      //   // get instance data
      //   $.get('/instance/' + thisid, function (data) {
      //   // put data in modal window
      //   $('#technicalName').val(thisid)
      //     .attr('disabled', 'disabled');
      //   $('#technicalName').removeClass('hidden');
      //   $('#technicalName_part1').addClass('hidden').val('1');
      //   $('#technicalName_part2').addClass('hidden').val('2');
      //   $('#technicalName_part3').addClass('hidden').val('3');
      //   $('#part1').addClass('hidden');
      //   $('#part2').addClass('hidden');
      //   $('#part3').addClass('hidden');
        
      //   $('#title').val(data.title);
      //   $('#accel').val(data.accel);
      //   $('#url_root').val(data.url_root);
      //   $('#url_root').attr('disabled', 'disabled');
      //   $('#date_input').val(data.date);
      //   $('#tblAppendGrid').appendGrid('load', data.users);
      //   $('#create-submit-button').removeAttr('disabled');/**/
      //   });
      // });
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
        if ((tcp1.match(alphanum)) && (tcp2.match(alphanum)) && (tcp3.match(numrik))) {
          $('#create-submit-button').removeAttr('disabled');
        }
        else {
          $('#create-submit-button').attr('disabled', 'disabled');
        }
      });


      grid.onSort.subscribe(function (e, args) {
        var cols = args.sortCols;

        dataView.sort(function (dataRow1, dataRow2) {
          for (var i = 0, l = cols.length; i < l; i++) {
            var field = cols[i].sortCol.field;
            var sign = cols[i].sortAsc ? 1 : -1;
            var value1 = dataRow1[field], value2 = dataRow2[field];
            var result = (value1 === value2 ? 0 : ( value1 > value2 ? 1 : -1)) * sign;
            if (result != 0) {
              return result;
            }
          }
          return 0;
        });

        grid.invalidate();
        grid.render();
        makeButtons();
      });

      // Initialize appendGrid
      // $('#tblAppendGrid').appendGrid({
      //   caption: 'Utilisateurs / rôles',
      //   initRows: 1,
      //   columns: [
      //     { name: 'email', display: 'Email', type: 'email', ctrlAttr: { maxlength: 100 }, ctrlCss: { width: '200px'} },
      //     { name: 'role', display: 'Role', type: 'select', ctrlOptions: { uploader: 'uploader', manager: 'manager', admin: 'administrator'}, ctrlCss: { width: '140px'} },
      //     { name: 'RecordId', type: 'hidden', value: 0 }
      //   ],
      //   i18n: {
      //     append: 'Add a user',
      //     removeLast: 'Remove the last user'
      //   }
      // });
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
            'Erreur : the data server returned an error (' 
              + jqXHR.status + ' : ' + jqXHR.statusText + ')'
          );
          console.error(jqXHR);
        });
      });

    }
  }).error(function (jqXHR) {
    alert(
      'Erreur : the data server returned an error ('
        + jqXHR.status + ' : ' + jqXHR.statusText + ')'
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
        technicalName = $('#technicalName_part1').val() + '_' + 
          $('#technicalName_part2').val() + '_' + $('#technicalName_part3').val();
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
});