import { useCallback, useEffect, useState } from "react";
import "./App.css";

type TaskProps = {
  id: string;
  task: string;
  isCompleted: boolean;
  createdAt: string;
};

function App() {
  const [newTask, setNewTask] = useState<string>("");
  const [isModify, setIsModify] = useState({
    isModify: false,
    idTask: "",
    task: "",
  });
  const [todos, setTodos] = useState<TaskProps[]>([]);

  const handleAddTask = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTask(e.target.value);
  };

  const handSendNewTask = useCallback(() => {
    fetch("http://localhost:8000/api/todos", {
      method: "POST",
      body: JSON.stringify({
        task: newTask,
        isCompleted: false,
      }),
    })
      .then(() => fetch("http://localhost:8000/api/todos"))
      .then((response) => response.json())
      .then((data) => {
        setTodos(data.data);
        setNewTask("");
      });
  }, [newTask]);

  useEffect(() => {
    fetch("http://localhost:8000/api/todos")
      .then((response) => response.json())
      .then((data) => setTodos(data.data));
  }, []);

  const handleDeleteTask = (todo: TaskProps) => {
    console.log("taskId", todo);
    fetch(`http://localhost:8000/api/todos/${todo.id}`, {
      method: "DELETE",
    })
      .then((response) => response.json)
      .then(() => fetch("http://localhost:8000/api/todos"))
      .then((response) => response.json())
      .then((data) => setTodos(data.data));
  };

  const handleCompleteTask = (todo: TaskProps) => {
    fetch(`http://localhost:8000/api/todos/${todo.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        isCompleted: !todo.isCompleted,
      }),
    })
      .then((response) => response.json)
      .then(() => fetch("http://localhost:8000/api/todos"))
      .then((response) => response.json())
      .then((data) => setTodos(data.data));
  };

  const handleModifiedTask = (todo: TaskProps) => {
    fetch(`http://localhost:8000/api/todos/${todo.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        task: isModify.task,
      }),
    })
      .then((response) => response.json)
      .then(() => fetch("http://localhost:8000/api/todos"))
      .then((response) => response.json())
      .then((data) => {
        setTodos(data.data);
        setIsModify({ isModify: false, idTask: "", task: "" });
      });
  };

  return (
    <>
      <input type="text" onChange={handleAddTask} value={newTask} />
      <button onClick={handSendNewTask}>Add</button>

      <ul>
        {todos
          ?.sort(
            (a: TaskProps, b: TaskProps): number =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .map((todo: TaskProps) => (
            <li key={todo.id}>
              {isModify.idTask === todo.id ? (
                <>
                  <input
                    type="text"
                    onChange={(e) =>
                      setIsModify((prevState) => ({
                        ...prevState,
                        task: e.target.value,
                      }))
                    }
                    value={isModify.task || todo.task}
                  />
                  <button onClick={() => handleModifiedTask(todo)}>Save</button>
                </>
              ) : (
                <label htmlFor={`${todo.id}`}>
                  {todo.task} - {todo.isCompleted ? "✅" : "❌"}
                  <input
                    style={{ visibility: "hidden" }}
                    id={`${todo.id}`}
                    type="checkbox"
                    checked={todo.isCompleted}
                    onChange={() => handleCompleteTask(todo)}
                  />
                </label>
              )}
              <button onClick={() => handleDeleteTask(todo)}>Delete</button>
              <button
                onClick={() =>
                  setIsModify((prevState) => ({
                    ...prevState,
                    isModify: !prevState.isModify,
                    idTask: prevState.idTask.length > 0 ? "" : todo.id,
                  }))
                }
              >
                Modify
              </button>
            </li>
          ))}
      </ul>
    </>
  );
}

export default App;
