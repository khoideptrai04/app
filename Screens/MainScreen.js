import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MainScreen() {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const loadNotes = async () => {
      const storedNotes = await getNotes();
      setNotes(storedNotes);
    };
    loadNotes();
  }, []);

  const addNote = async () => {
    if (note.trim()) {
      const newNote = { id: Date.now().toString(), content: note };
      const updatedNotes = [...notes, newNote];
      setNotes(updatedNotes);
      await saveNotes(updatedNotes);
      setNote('');
    }
  };

  const deleteNote = async (id) => {
    const updatedNotes = notes.filter((item) => item.id !== id);
    setNotes(updatedNotes);
    await saveNotes(updatedNotes);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ứng dụng ghi chú</Text>
      <TextInput
        style={styles.input}
        value={note}
        onChangeText={setNote}
        placeholder="Nhập ghi chú của bạn"
      />
      <Button title="Thêm ghi chú" onPress={addNote} />
      <FlatList
        data={notes}
        renderItem={({ item }) => (
          <View style={styles.noteItem}>
            <Text style={styles.noteText}>{item.content}</Text>
            <TouchableOpacity onPress={() => deleteNote(item.id)}>
              <Text style={styles.deleteButton}>Xóa</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const saveNotes = async (notes) => {
  try {
    const jsonValue = JSON.stringify(notes);
    await AsyncStorage.setItem('notes', jsonValue);
  } catch (e) {
    console.log('Lỗi khi lưu: ', e);
  }
};

const getNotes = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('notes');
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.log('Lỗi khi lấy: ', e);
    return [];
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  noteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  noteText: {
    fontSize: 16,
  },
  deleteButton: {
    color: 'red',
    fontWeight: 'bold',
  },
});