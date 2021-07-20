$("document").ready(function() {
    $('.tabs').tabs();
    $('.modal').modal();
    connectSQL();
    init();
    updateHTML();
    showTodos();
    editStatusBtn();
})
var db;
var _lastId
const connectSQL = () => {
	var databaseName = 'todolistdb';
	var versionNumber = '1.0';
	var textDescription = 'database for a todo list';
	var estimatedSizeOfDatabase = 2 * 1024 * 1024;

	db = openDatabase(
		databaseName,
		versionNumber,
		textDescription,
		estimatedSizeOfDatabase
	);
}//end test_sql

//create databases
const init = () => {
    db.transaction(tx => {
        tx.executeSql('CREATE TABLE IF NOT EXISTS todos (id unique,'+
        'title text,content BLOB, status text)');
        //id: the unique id of the todo
        //title: the title of the todo
        //content: the content of the todo
        //status: if you havent started: todo, if youre working on it: working, if youre done: finished, if you have problems: problem <--- WITHOUT AN "s".
        createRow('todos', 'title, content, status, id', `'Trash', 'Take out the trash', 'working', 1`)
        createRow('todos', 'title, content, status, id', `'Trash 2', 'Take out the trash again', 'working', 2`)
        createRow('todos', 'title, content, status, id', `'Trash 3', 'Take out the trash for a third time', 'working', 3`)
        createRow('todos', 'title, content, status, id', `'Trash 4', 'Take out the trash... again', 'working', 4`)
        createRow('todos', 'title, content, status, id', `'Trash 5', 'YET AGAIN YOU HAVE TO TAKE OUT THE TRASH!!!', 'working', 5`)
    })
}

const updateHTML = () => {
    db.transaction(tx => {
        tx.executeSql('SELECT * FROM todos', [], (tx, results) => {
            var data = results;
            let todosHtml = ``;
            let workingHtml = ``;
            let finishedHtml = ``;
            let problemsHtml = ``;
            for (var i of data.rows) {
                switch(i.status) {
                    case 'todo':
                        todosHtml += buildTodoHTML(i);
                        break;
                    case 'working':
                        workingHtml += buildTodoHTML(i);
                        break;
                    case 'finished':
                        finishedHtml += buildTodoHTML(i);
                        break;
                    case 'problem':
                        problemsHtml += buildTodoHTML(i);
                        break;
                }
            }
            $('.container #todos').html(todosHtml);
            $('.container #working').html(workingHtml);
            $('.container #finished').html(finishedHtml);
            $('.container #problems').html(problemsHtml);
        })
    })
}

const buildTodoHTML = todo => {
    let html = ``;
    html += `<div class="row todo_item zebra col s12" data-sqlid="${todo.id}" title="${todo.id}">`
    html += `<div class="col s4">`
    html += `<h5>${todo.title}</h5><br>`
    html += `<p>${todo.content}</p><br>`
    html += `</div>`
    html += `<div class="col s4"></div>`
    
    html += `<div class="col s4 valign-wrapper todoeditbtns">`
    html += `<a class="btn edittodo">edit</a>`
    html += `<a class="btn statustodo">change status</a>`
    html += `</div>` //close column
    html += `</div>`
    return html;
}
console.log(this)
const editStatusBtn = () => {
    // console.log("hi")
    $('.container').on("click", ".statustodo", e => {
        _lastId = Number($(e.currentTarget).parent().parent().attr("data-sqlid"));
        //open modal
        $("#editstatus").modal("open")
        getRow("todos", _lastId, data => {
            $(`#editstatus .modal-content #editstatusselect option`).removeAttr("selected")
            $(`#editstatus .modal-content #editstatusselect option[value=${data.rows[0].status}]`).attr("selected", "true")
        })
        $("#editstatus .modal-content #editstatusselect")
        // doEditStatus(Number($(e.currentTarget).parent().parent().attr("data-sqlid")), new status)
    })
    $('body').on("click", ".submiteditstatus", e => {
        var select = $("#editstatusselect").val();
        doEditStatus(_lastId, select)
    })
}

const doEditStatus = (todoId, newStatus) => {
    db.transaction(tx => {
        tx.executeSql(`UPDATE todos SET status = '${newStatus}' WHERE id = ${todoId}`)
        updateHTML()
    })
}

const showTodos = () => {
    db.transaction(tx => {
        tx.executeSql('SELECT * FROM todos', [], (tx, results) => {
            var data = results;
            console.log(data)
        })
    })
}

//CRUD functions
const createRow = (table, columns, data) => {
    db.transaction(tx => {
        var query = `INSERT INTO ${table} (${columns}) VALUES (${data})`;
        // console.log(query)
        tx.executeSql(query);
    })
}

//helper functions

const getRow = (tablename, id, callbackfunc) => {
    db.transaction(tx => {
        tx.executeSql(`SELECT * FROM ${tablename} WHERE id = ${id}`, [], (tx, results) => {
            callbackfunc(results);
        })
    })
}