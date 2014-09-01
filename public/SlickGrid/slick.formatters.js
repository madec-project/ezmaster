/***
 * Contains basic SlickGrid formatters.
 * 
 * NOTE:  These are merely examples.  You will most likely need to implement something more
 *        robust/extensible/localizable/etc. for your use!
 * 
 * @module Formatters
 * @namespace Slick
 */

(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "Formatters": {
        "ActionFormatter": ActionFormatter,
        // "UploadFormatter": UploadFormatter,
        // "ModifyFormatter": ModifyFormatter,
        // "DeleteFormatter": DeleteFormatter,
        "PercentComplete": PercentCompleteFormatter,
        "PercentCompleteBar": PercentCompleteBarFormatter,
        "YesNo": YesNoFormatter,
        "Checkmark": CheckmarkFormatter
      }
    }
  });

  function ActionFormatter(row, cell, value, columnDef, dataContext) {
    var ref=dataContext.technicalName;
    return '<a href="/upload/' + dataContext.technicalName + '"' +
           ' class="upload-button" style="font-size:50%">Déposer dans l\'instance « ' +
            dataContext.technicalName +
           ' »</a> ' +
           '<a href="#createModal"' +
           ' data-toggle="modal" data-id="' + dataContext.technicalName + '"' +
           ' class="modify-button" style="font-size:50%">Modifier l\'instance « ' +
            dataContext.technicalName +
           ' »</a> ' +
           '<a  href="#deleteModal"' +
           ' data-toggle="modal" data-id="' + dataContext.technicalName + '"' +
           ' class="delete-button" style="font-size:50%">Supprimer l\'instance « ' +
            dataContext.technicalName +
           ' »</a> '
           ;
  }
  // function UploadFormatter(row, cell, value, columnDef, dataContext) {
  //   return '<a href="/upload/' + dataContext.technicalName +
  //          '" class="ui-button-icon-primary ui-icon ui-icon-arrowthickstop-1-s" ' +
  //          'title="déposer dans l\'instance « ' + dataContext.technicalName +
  //          ' »"></a>';
  // }

  // function ModifyFormatter(row, cell, value, columnDef, dataContext) {
  //   return '<a href="#createModal" class="ui-button-icon-primary ui-icon ui-icon-pencil modify-button" role="button" ' +
  //          'title="modifier l\'instance « ' + dataContext.technicalName +
  //          ' »"' +
  //          'data-toggle="modal" data-id="' + dataContext.technicalName + '">Modifier</a>';
  // }

  // function DeleteFormatter(row, cell, value, columnDef, dataContext) {
  //   return '<a href="#deleteModal" class="ui-button-icon-primary ui-icon ui-icon-trash delete-button" role="button" ' +
  //          'title="supprimer l\'instance « ' + dataContext.technicalName +
  //          ' »"' +
  //          'data-toggle="modal" data-id="' + dataContext.technicalName + '">Supprimer</a>';
  // }


  function PercentCompleteFormatter(row, cell, value, columnDef, dataContext) {
    if (value == null || value === "") {
      return "-";
    } else if (value < 50) {
      return "<span style='color:red;font-weight:bold;'>" + value + "%</span>";
    } else {
      return "<span style='color:green'>" + value + "%</span>";
    }
  }

  function PercentCompleteBarFormatter(row, cell, value, columnDef, dataContext) {
    if (value == null || value === "") {
      return "";
    }

    var color;

    if (value < 30) {
      color = "red";
    } else if (value < 70) {
      color = "silver";
    } else {
      color = "green";
    }

    return "<span class='percent-complete-bar' style='background:" + color + ";width:" + value + "%'></span>";
  }

  function YesNoFormatter(row, cell, value, columnDef, dataContext) {
    return value ? "Yes" : "No";
  }

  function CheckmarkFormatter(row, cell, value, columnDef, dataContext) {
    return value ? "<img src='../images/tick.png'>" : "";
  }
})(jQuery);
