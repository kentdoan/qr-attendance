import { configureStore } from '@reduxjs/toolkit';
import studentReducer from '../features/student/studentSlice';
import teacherReducer from '../features/teacher/teacherSlice';

export const store = configureStore({
  reducer: {
    student: studentReducer,
    teacher: teacherReducer,
  },
});
