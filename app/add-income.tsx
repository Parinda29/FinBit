import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

export default function AddIncome() {
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Income</Text>

      <TextInput
        placeholder="Amount"
        keyboardType="numeric"
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
      />

      <TextInput
        placeholder="Source (Salary, Freelance)"
        style={styles.input}
        value={source}
        onChangeText={setSource}
      />

      <TouchableOpacity style={styles.button}>
        <Text style={{color:"#fff"}}>Save Income</Text>
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
    backgroundColor:"#1C8C8C",
    padding:15,
    borderRadius:10,
    alignItems:"center"
  }
});