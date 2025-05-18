import { useCallback, useState } from 'react';
import './App.css';
import { useQuery, useZero } from '@rocicorp/zero/react';
import { Schema } from '../schema';

type TaskProps = {
  id: string;
  task: string;
  isCompleted: boolean;
  createdAt: number;
};

function App() {
  const [newTask, setNewTask] = useState<string>('');
  const [isModify, setIsModify] = useState({
    isModify: false,
    idTask: '',
    task: '',
  });

  const z = useZero<Schema>();
  const [todos] = useQuery(z.query.todo.orderBy('createdAt', 'desc'));

  console.log('test', todos);

  const handleAddTask = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTask(e.target.value);
  };

  const handSendNewTask = useCallback(async () => {
    await z.mutate.todo.insert({
      id: crypto.randomUUID(),
      task: newTask,
      isCompleted: false,
      createdAt: Date.now(),
    });

    setNewTask('');
  }, [newTask, z]);

  const handleDeleteTask = async (todo: TaskProps) => {
    await z.mutate.todo.delete({
      id: todo.id,
    });
  };

  const handleCompleteTask = async (todo: TaskProps) => {
    await z.mutate.todo.update({
      id: todo.id,
      isCompleted: !todo.isCompleted,
    });
  };

  const handleModifiedTask = async (todo: TaskProps) => {
    await z.mutate.todo.update({
      id: todo.id,
      task: isModify.task,
      isCompleted: todo.isCompleted,
    });

    setIsModify({ isModify: false, idTask: '', task: '' });
  };

  return (
    <>
      <input type="text" onChange={handleAddTask} value={newTask} />
      <button onClick={handSendNewTask}>Add</button>

      <ul>
        {todos
          ?.sort((a, b): number => b.createdAt - a.createdAt)
          .map(todo => (
            <li key={todo.id}>
              {isModify.isModify && isModify.idTask === todo.id ? (
                <>
                  <input
                    type="text"
                    onChange={e =>
                      setIsModify(prevState => ({
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
                  {todo.task} - {todo.isCompleted ? '✅' : '❌'}
                  <input
                    style={{ visibility: 'hidden' }}
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
                  setIsModify(prevState => ({
                    ...prevState,
                    isModify: !prevState.isModify,
                    idTask: prevState.idTask.length > 0 ? '' : todo.id,
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
