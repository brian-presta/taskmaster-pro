var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // Check due date
  auditTask(taskLi)

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};
var auditTask = function(task) {
  task = $(task)
  // get date from task element
  var date = task.find("span").text().trim()
  // convert date to moment object at 5:00 PM
  var time = moment(date,"L").set("hour",17)
  task.removeClass("list-group-item-warning list-group-item-danger")
  if (moment().isAfter(time)) {
    task.addClass("list-group-item-danger")
  }
  else if (Math.abs(moment().diff(time,"days")) <= 2) {
    task.addClass("list-group-item-warning")
  }
};
// task text was clicked
$(".list-group").on("click",'p',function(){
  var text = $(this).text()
  var textInput = $("<textarea>").addClass("form-control").val(text)
  $(this).replaceWith(textInput)
  textInput.trigger("focus")
});
$(".list-group").on("blur","textarea",function(){
  var text = $(this).val().trim()
  var status = $(this).closest(".list-group").attr("id").replace("list-","")
  var index = $(this).closest(".list-group-item").index()
  tasks[status][index].text = text
  saveTasks()
  var taskP = $("<p>").addClass("m-1").text(text)
  $(this).replaceWith(taskP)
});
// edit handling (due date was clicked)
$(".list-group").on("click","span",function(){
  var date = $(this).text().trim()
  var dateInput = $("<input>").attr("type","text").addClass("form-control").val(date)
  dateInput.datepicker({
    defaultDate: 1,
    // minDate: 1,
    onClose: function(){
      $(this).trigger("change")
    }
  })
  $(this).replaceWith(dateInput)
  dateInput.trigger("focus")
});
$(".list-group").on("change","input",function(){
  var date = $(this).val().trim()
  var status = $(this).closest(".list-group").attr("id").replace("list-","")
  var index = $(this).closest(".list-group-item").index()
  tasks[status][index].date = date
  saveTasks()
  var taskSpan = $("<span>").addClass('badge badge-primary badge-pill').text(date)
  $(this).replaceWith(taskSpan)
  auditTask($(taskSpan).closest(".list-group-item"))
});
// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();
  if (!taskDate) {
    taskDate = moment().add(1,"days").format("M/D/YYYY")
  }
  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

$(".card .list-group").sortable({
  activate: function(){
    $(this).addClass("dropover")
    $(".bottom-trash").addClass("bottom-trash-drag")
  },
  deactivate: function(){
    $(this).removeClass("dropover")
    $(".bottom-trash").removeClass("bottom-trash-drag")
  },
  over: function(event){$(event.target).addClass("dropover-active")},
  out: function(event){$(event.target).removeClass("dropover-active")},
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  update: function(event) {
    var holder = []
    $(this).children().each(function(){
      var text = $(this).find("p").text().trim()
      var date = $(this).find("span").text().trim()
      holder.push({text:text,date:date})
    })
    var arrName = $(this).attr("id").replace("list-","")
    tasks[arrName] = holder
    saveTasks()
  }  
});
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  over: function(event, ui) {
    $(".bottom-trash").addClass("bottom-trash-active")
  },
  out: function(event, ui) {
    $("bottom-trash").removeClass("bottom-trash-active")
  },
  drop: function(event,ui) {
    ui.draggable.remove()
    $("bottom-trash").removeClass("bottom-trash-active")
  }

})
$('#modalDueDate').datepicker({
  defaultDate: 1
  // minDate: 1
})
setInterval(function(){
  $(".card .list-group-item").each(function(x){auditTask(x)})
},180000)
// load tasks for the first time
loadTasks();


