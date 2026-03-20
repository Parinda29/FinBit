import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

export default function AddExpense() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Expense</Text>

      <TextInput
        placeholder="Amount"
        keyboardType="numeric"
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
      />

      <TextInput
        placeholder="Category (Food, Travel)"
        style={styles.input}
        value={category}
        onChangeText={setCategory}
      />

      <TouchableOpacity style={styles.button}>
        <Text style={{color:"#fff"}}>Save Expense</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,padding:20,backgroundColor:"#F2F8F8"},
  title:{fontSize:22,fontWeight:"bold",marginBottom:20},
  input:{
    borderWidth:1,
    borderColor:"#ddd",
    padding:12,
    borderRadius:10,
    marginBottom:10,
    backgroundColor:"#fff"
  },
  button:{
    backgroundColor:"#D9534F",
    padding:15,
    borderRadius:10,
    alignItems:"center"
  }
});