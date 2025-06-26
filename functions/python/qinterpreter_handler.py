#!/usr/bin/env python3
import sys
import json
import numpy as np
from typing import Dict, List, Any
import traceback

# Añadir qinterpreter al path
sys.path.append('./python')

# Importar Qinterpreter
try:
    from qinterpreter.quantumgateway.quantum_circuit import QuantumCircuit, QuantumGate
    from qinterpreter.quantumgateway.main import simulate_circuit, translate_to_framework
    from qinterpreter.quantumgateway.quantum_translator import QiskitTranslator
except ImportError as e:
    print(json.dumps({"error": f"Import error: {str(e)}"}))
    sys.exit(1)

def circuit_from_json(circuit_data: Dict) -> QuantumCircuit:
    """Convierte JSON a QuantumCircuit"""
    qc = QuantumCircuit(
        num_qubits=circuit_data['num_qubits'],
        num_classical_bits=circuit_data.get('num_classical_bits', 0)
    )
    
    for gate in circuit_data.get('gates', []):
        qg = QuantumGate(
            name=gate['name'],
            qubits=gate['qubits'],
            params=gate.get('params', None)
        )
        qc.add_gate(qg)
    
    return qc

def handle_simulate(circuit_json: str, shots: str, framework: str) -> Dict:
    """Maneja la simulación del circuito"""
    try:
        circuit_data = json.loads(circuit_json)
        qc = circuit_from_json(circuit_data)
        
        # Simular
        results = simulate_circuit(qc, framework)
        
        # Convertir resultados a formato serializable
        if hasattr(results, 'get_counts'):
            results = results.get_counts()
        
        return {
            "success": True,
            "results": results,
            "shots": int(shots)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }

def handle_statevector(circuit_json: str) -> Dict:
    """Calcula el statevector del circuito"""
    try:
        circuit_data = json.loads(circuit_json)
        
        # Crear circuito sin mediciones
        circuit_no_measure = {
            "num_qubits": circuit_data["num_qubits"],
            "num_classical_bits": 0,
            "gates": [g for g in circuit_data.get("gates", []) 
                     if g["name"].upper() != "MEASURE"]
        }
        
        qc = circuit_from_json(circuit_no_measure)
        
        # Obtener statevector
        translator = QiskitTranslator()
        translator.translate(qc)
        statevector = translator.get_statevector()
        
        # Formatear estados
        states = []
        num_qubits = circuit_data["num_qubits"]
        
        for i in range(2 ** num_qubits):
            amplitude = statevector[i] if i < len(statevector) else complex(0)
            binary = format(i, f'0{num_qubits}b')
            
            state_info = {
                "index": i,
                "state": f"|{binary}⟩",
                "binary": binary,
                "amplitude": {
                    "real": float(amplitude.real),
                    "imag": float(amplitude.imag),
                    "magnitude": float(abs(amplitude)),
                    "phase": float(np.angle(amplitude))
                },
                "probability": float(abs(amplitude) ** 2)
            }
            
            if state_info["probability"] > 0.001:
                states.append(state_info)
        
        return {
            "success": True,
            "states": states,
            "num_qubits": num_qubits
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }

def handle_validate(circuit_json: str) -> Dict:
    """Valida un circuito"""
    try:
        circuit_data = json.loads(circuit_json)
        
        # Validaciones básicas
        num_qubits = circuit_data.get('num_qubits', 0)
        num_classical_bits = circuit_data.get('num_classical_bits', 0)
        
        if num_qubits <= 0:
            return {"valid": False, "message": "Number of qubits must be positive"}
        
        for gate in circuit_data.get('gates', []):
            # Verificar índices de qubits
            for qubit in gate['qubits']:
                if qubit >= num_qubits or qubit < 0:
                    return {
                        "valid": False, 
                        "message": f"Qubit index {qubit} out of range"
                    }
            
            # Verificar número de qubits por compuerta
            gate_name = gate['name'].upper()
            if gate_name in ["CNOT", "CX", "CY", "CZ", "SWAP"]:
                if len(gate['qubits']) != 2:
                    return {
                        "valid": False,
                        "message": f"{gate['name']} requires exactly 2 qubits"
                    }
        
        # Intentar crear el circuito
        qc = circuit_from_json(circuit_data)
        
        return {"valid": True, "message": "Circuit is valid"}
    except Exception as e:
        return {
            "valid": False,
            "message": str(e)
        }

def handle_export(circuit_json: str, framework: str) -> Dict:
    """Exporta el circuito a código"""
    try:
        circuit_data = json.loads(circuit_json)
        
        if framework == "qinterpreter":
            code = generate_qinterpreter_code(circuit_data)
        elif framework == "qiskit":
            code = generate_qiskit_code(circuit_data)
        else:
            return {
                "success": False,
                "error": f"Framework '{framework}' not supported for export"
            }
        
        return {
            "success": True,
            "code": code,
            "framework": framework
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def generate_qinterpreter_code(circuit_data: Dict) -> str:
    """Genera código Qinterpreter"""
    lines = [
        "from quantumgateway.quantum_circuit import QuantumCircuit, QuantumGate",
        "from quantumgateway.main import simulate_circuit, bloch_sphere",
        "",
        f"# Create circuit with {circuit_data['num_qubits']} qubits",
        f"qc = QuantumCircuit({circuit_data['num_qubits']}, {circuit_data.get('num_classical_bits', 0)})",
        ""
    ]
    
    for gate in circuit_data.get('gates', []):
        params = gate.get('params', [])
        params_str = f", {params}" if params else ""
        lines.append(f'qc.add_gate(QuantumGate("{gate["name"]}", {gate["qubits"]}{params_str}))')
    
    lines.extend([
        "",
        "# Simulate the circuit",
        'results = simulate_circuit(qc, "qiskit")',
        "print(results)",
        "",
        "# Visualize on Bloch spheres",
        "# bloch_sphere(qc)"
    ])
    
    return "\n".join(lines)

def generate_qiskit_code(circuit_data: Dict) -> str:
    """Genera código Qiskit"""
    lines = [
        "from qiskit import QuantumCircuit",
        "from qiskit_aer import AerSimulator",
        "",
        f"qc = QuantumCircuit({circuit_data['num_qubits']}, {circuit_data.get('num_classical_bits', 0)})",
        ""
    ]
    
    for gate in circuit_data.get('gates', []):
        name = gate['name'].upper()
        qubits = gate['qubits']
        
        if name == "H":
            lines.append(f"qc.h({qubits[0]})")
        elif name in ["CNOT", "CX"]:
            lines.append(f"qc.cx({qubits[0]}, {qubits[1]})")
        elif name == "X":
            lines.append(f"qc.x({qubits[0]})")
        elif name == "Y":
            lines.append(f"qc.y({qubits[0]})")
        elif name == "Z":
            lines.append(f"qc.z({qubits[0]})")
        elif name == "MEASURE":
            lines.append(f"qc.measure({qubits[0]}, {qubits[1]})")
    
    return "\n".join(lines)

def handle_bloch(circuit_json: str) -> Dict:
    """Calcula datos para esferas de Bloch"""
    try:
        circuit_data = json.loads(circuit_json)
        qc = circuit_from_json(circuit_data)
        
        # Por ahora, retornar datos básicos
        # En producción, calcularías los vectores de Bloch reales
        bloch_data = []
        for qubit in range(circuit_data['num_qubits']):
            bloch_data.append({
                "qubit": qubit,
                "vector": {"x": 0.0, "y": 0.0, "z": 1.0},
                "theta": 0.0,
                "phi": 0.0
            })
        
        return {
            "success": True,
            "bloch_spheres": bloch_data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# Main
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command specified"}))
        sys.exit(1)
    
    command = sys.argv[1]
    
    try:
        if command == "simulate":
            result = handle_simulate(sys.argv[2], sys.argv[3], sys.argv[4])
        elif command == "statevector":
            result = handle_statevector(sys.argv[2])
        elif command == "validate":
            result = handle_validate(sys.argv[2])
        elif command == "export":
            result = handle_export(sys.argv[2], sys.argv[3])
        elif command == "bloch":
            result = handle_bloch(sys.argv[2])
        else:
            result = {"error": f"Unknown command: {command}"}
        
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            "error": "Handler error",
            "details": str(e),
            "traceback": traceback.format_exc()
        }))