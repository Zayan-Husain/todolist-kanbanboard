$("document").ready(function() {
	$('.tabs').tabs();
	$('.modal').modal();
	connectSQL();
	init();
	updateHTML();
	showTodos();
	editStatusBtn();
	addTodoClick();
	deleteTodo();
	editTodoClick();
	createTodoTrigger();
	//input color mechanics
	$("#edittodocolor").change(function(event) {
		//put last color into the database
		_prevCol = $("#color_front").css('background-color');
		$("#color_front").css('background-color',$(this).val());
		_lastCol = $(this).val();
		_changedColorEditTodo = true;
	});
	
	$("#color_front").click(function(event) {
		$("#edittodocolor").click();
	});
	$("body").on("click", ".color_recent", e => {
		let color = $(e.target).css('background-color')
		$("#edittodocolor").attr("value", color);
		$("#color_front").css('background-color',color);
		_lastCol = color;
		_changedColorEditTodo = true;
	})
})
var db;
var _lastId;
var _lastCol;
var _prevCol;
var _changedColorEditTodo;
var todoInfo = {
	"todo": 0,
	"working": 0,
	"finished": 0,
	"problem": 0,
	"all": 0,
};
//sql
const connectSQL = () => {
	var databaseName = 'todolistdb2';
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
			'title text,content BLOB, color text, status text)');
			tx.executeSql('CREATE TABLE IF NOT EXISTS colors (id unique,'+
			'color text)');
			//id: the unique id of the todo
			//title: the title of the todo
			//content: the content of the todo
		//status: if you havent started: todo, if youre working on it: working, if youre done: finished, if you have problems: problem <--- WITHOUT AN "s".
		// createRow('todos', 'title, content, status, id', `'Trash', 'Take out the trash', 'working', 1`)
		// createRow('todos', 'title, content, status, id', `'Trash 2', 'Take out the trash again', 'working', 2`)
		// createRow('todos', 'title, content, status, id', `'Trash 3', 'Take out the trash for a third time', 'working', 3`)
		// createRow('todos', 'title, content, status, id', `'Trash 4', 'Take out the trash... again', 'working', 4`)
		// createRow('todos', 'title, content, status, id', `'Trash 5', 'YET AGAIN YOU HAVE TO TAKE OUT THE TRASH!!!', 'working', 5`)
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
			let _h = `<span class="notodosintab">No todos in this tab.</span>`
			$('.container #todos').html(todosHtml);
			$('.container #working').html(workingHtml);
			$('.container #finished').html(finishedHtml);
			$('.container #problems').html(problemsHtml);
			if(todosHtml === "") $('.container #todos').html(_h);
			if(workingHtml === "") {
				$('.container #working').html(_h);
			}
			if(finishedHtml === "") $('.container #finished').html(_h);
			if(problemsHtml === "") $('.container #problems').html(_h);
		})
	})
}

const buildTodoHTML = todo => {
	let html = ``;
	html += `<div class="row todo_item zebra col s12" data-sqlid="${todo.id}" title="${todo.id}" style="background-color:${todo.color};">`
	html += `<div class="col s4">`
	html += `<h5>${todo.title}</h5><br>`
	html += `<p>${todo.content}</p><br>`
	html += `</div>`
	html += `<div class="col s3"></div>`
		
	html += `<div class="col s5 valign-wrapper todoeditbtns">`
	html += `<a class="btn edittodo">edit</a>`
	html += `<a class="btn statustodo">change status</a>`
	html += `<a class="btn deletetodo red"><i class="fas fa-trash-alt"></i></a>`
	html += `</div>` //close column
	html += `</div>`
	return html;
}

const editTodoClick = () => { ////////////////////////////////////////////////////////////////////////////////////////////////////////////EDIT TODO
	$('body').on("click", ".edittodo", e => {
		_lastId = Number($(e.currentTarget).parent().parent().attr("data-sqlid"));
		getRow("todos", _lastId, data => {
			$("#edittodotitle").val(data.rows[0].title)
			$("#edittodocontent").val(data.rows[0].content)
			$("#edittodo").modal("open")
		})
	})
	$('body').on("click", ".submitedittodo", e => {
		if(_changedColorEditTodo) {
			countRows("colors", n => {
				if(n < 5) {
					console.log("gets in to here", n)
					createRow("colors", "id, color", `${n+1}, "${_prevCol}"`)
				}
				if(n === 5) {
					readAllRows("colors", function(d) {
						let tempCol = _lastCol; //temporary color
						var data = d.rows
						for(var i = 5; i > 0; i--) { //loop backwards (i = 5 4 3 2 1)
							var currentRowColor = data[i-1]["color"]
							updateRow("colors", `color = '${tempCol}'`, i, () => {})
							tempCol = currentRowColor;
						}
					})
				}
				db.transaction(tx => {
					tx.executeSql('SELECT * FROM colors ORDER BY id DESC', [], (tx, data) => {
						let rows = data.rows;
						for(var i in document.querySelectorAll(".color_recent")) {
							if(i === "entries") break;
							var o = document.querySelectorAll(".color_recent")[i];
							// var col = rows[Number(o.classList[1][1])].color
							if(i > rows.length - 1) break;
							o.style = `background-color: ${rows[i].color};`
							// console.log(col, i)
						}
					})//tx execute sql
				})//db transaction
			})
		}
		updateRow(`todos`, `'title' = '${$("#edittodotitle").val()}', 'content' = '${$("#edittodocontent").val()}', 'color' = '${_lastCol}'`, _lastId, () => {
			updateHTML();
		})
		_changedColorEditTodo = false;
	})
}

const deleteTodo = () => {
	$('body').on("click", ".deletetodo", e => {
		_lastId = Number($(e.currentTarget).parent().parent().attr("data-sqlid"));
		deleteRow("todos", _lastId)
		updateHTML();
	})
}

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

const createTodoTrigger = () => {
	$("body").on("click", ".createtodotrigger", () => {
		$("#createtodotitle").val("")
		$("#createtodocontent").val("")
	})
}

const addTodoClick = () => {
	$("body").on("click", ".submitaddtodo", e => {
		var submitBtn = e.currentTarget;
		var title = $('#createtodotitle').val();
		var content = $('#createtodocontent').val();
		var status = $('#createtodostatusselect').val();
		doAddTodo(title, content, status);
	})
}

const doAddTodo = (title, content, status) => {
	countRows("todos", n => {
		createRow("todos", "title, content, status, id", `'${title}', '${content}', '${status}', ${n+1}`)
		updateHTML();
	})
}

const showTodos = () => {
	db.transaction(tx => {
		tx.executeSql('SELECT * FROM todos', [], (tx, results) => {
			var data = results;
		})
	})
}

//CRUD functions

const readAllRows = (table, callbackfunc) => {
	db.transaction(tx => {
		tx.executeSql('SELECT * FROM '+table, [],  function (tx, results) {
			callbackfunc(results)
		});
	});
}//end readAllRows

const createRow = (table, columns, data) => {
	db.transaction(tx => {
		var query = `INSERT INTO ${table} (${columns}) VALUES (${data})`;
		// console.log(query)
		tx.executeSql(query);
	})
}
const updateRow = (table, set, id, callbackfunc) => {
	db.transaction(function (tx) {
	  var query = `UPDATE ${table} SET ${set} WHERE id = ${id}`;
	  tx.executeSql(query);
	  callbackfunc()
	});
}//end ydb_update

const deleteRow = (table, id) => {
	db.transaction(function (tx) {

	  query = `DELETE FROM ${table} WHERE id = ${id}`;
	  tx.executeSql(query);
	});
} //end ydb_delete

const deleteRowWhere = (table, where) => {
	db.transaction(function (tx) {

	  query = 'DELETE FROM '+table+' WHERE '+where;
	  tx.executeSql(query);
	});
} //end ydb_delete

//helper functions

const getRow = (tablename, id, callbackfunc) => {
	db.transaction(tx => {
		tx.executeSql(`SELECT * FROM ${tablename} WHERE id = ${id}`, [], (tx, results) => {
			callbackfunc(results);
		})
	})
}

const countRows = (table,func) => {
	var x;
	db.readTransaction(function (t) {
		t.executeSql('SELECT COUNT(*) AS c FROM ' + table, [], function (t, r) {
			x= r.rows[0].c+"TableName"+table;
			func(r.rows[0].c);
		});
	});
	return x
}
function hexToHSL(H) {
	// Convert hex to RGB first
	let r = 0, g = 0, b = 0;
	if (H.length == 4) {
	  r = "0x" + H[1] + H[1];
	  g = "0x" + H[2] + H[2];
	  b = "0x" + H[3] + H[3];
	} else if (H.length == 7) {
	  r = "0x" + H[1] + H[2];
	  g = "0x" + H[3] + H[4];
	  b = "0x" + H[5] + H[6];
	}
	// Then to HSL
	r /= 255;
	g /= 255;
	b /= 255;
	let cmin = Math.min(r,g,b),
		cmax = Math.max(r,g,b),
		delta = cmax - cmin,
		h = 0,
		s = 0,
		l = 0;
  
	if (delta == 0)
	  h = 0;
	else if (cmax == r)
	  h = ((g - b) / delta) % 6;
	else if (cmax == g)
	  h = (b - r) / delta + 2;
	else
	  h = (r - g) / delta + 4;
  
	h = Math.round(h * 60);
  
	if (h < 0)
	  h += 360;
  
	l = (cmax + cmin) / 2;
	s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
	s = +(s * 100).toFixed(1);
	l = +(l * 100).toFixed(1);
  
	return "hsl(" + h + "," + s + "%," + l + "%)";
}
function RGBToHex(rgb) {
	//what should be inserted: "rgb(111, 111, 111)"
	rgb = rgb.substring(4, rgb.length - 2)
	//rgb: "111, 111, 111"
	let rgbArr = rgb.split(", ")
	//rgbArr: ["111", "111", "111"]
	//rgbArr[0]: "111"
	//Number(rgbArr[0]): 111 <-- a number, not a string
	r = Number(rgbArr[0]).toString(16);
	g = Number(rgbArr[1]).toString(16);
	b = Number(rgbArr[2]).toString(16);

	if (r.length == 1)
		r = "0" + r;
	if (g.length == 1)
		g = "0" + g;
	if (b.length == 1)
		b = "0" + b;
	return "#" + r + g + b;
}