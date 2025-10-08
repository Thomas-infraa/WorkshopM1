import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { io, Socket } from "socket.io-client";

const socket: Socket = io("http://localhost:5000");

interface LocationState {
    username: string;
    room: string;
    role: string;
}

interface ChatResponse {
    username: string;
    msg: string;
}

interface ServerMessage {
    msg: string;
}

const maladies = {
    "Grippe saisonnière": [
        "Fièvre élevée",
        "Fatigue intense",
        "Toux sèche",
        "Courbatures",
    ],
    "Angine bactérienne": [
        "Fièvre élevée",
        "Gorge rouge douloureuse",
        "Difficulté à avaler",
        "Fatigue",
    ],
    "Gastro-entérite": [
        "Fièvre légère",
        "Douleurs abdominales",
        "Diarrhée / vomissements",
        "Fatigue",
    ],
    "Covid-19 (forme légère)": [
        "Fièvre légère à modérée",
        "Toux sèche",
        "Fatigue",
        "Perte du goût / odorat",
    ],
} as const;

type MaladieKey = keyof typeof maladies;


export default function MedecinPage() {
    const location = useLocation();
    const { username, room } = location.state as LocationState;

    const [selectedMaladie, setSelectedMaladie] = useState<MaladieKey | "">("");
    // const [selectedSymptome, setSelectedSymptome] = useState("");
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<string[]>([]);
    const [symptoms, setSymptoms] = useState(""); // Nouvel état pour les symptômes


    useEffect(() => {
        socket.emit("join_room", { username, room });

        const handleServerMessage = (data: ServerMessage) => {
        setMessages((prev) => [...prev, `[SYSTEM] ${data.msg}`]);
        };

        const handleChatResponse = (data: ChatResponse) => {
        setMessages((prev) => [...prev, `${data.username}: ${data.msg}`]);
        };

        socket.on("server_message", handleServerMessage);
        socket.on("chat_response", handleChatResponse);

        return () => {
        socket.off("server_message", handleServerMessage);
        socket.off("chat_response", handleChatResponse);
        };
    }, [username, room]);

    // const sendSymptome = () => {
    //     if (!selectedMaladie || !selectedSymptome) return; 
    //     socket.emit("symptome_envoi", {
    //         username,
    //         room,
    //         maladie: selectedMaladie
    //     });
    // };

    const sendMessage = () => {
        if (!message.trim()) return;
        socket.emit("chat_message", { username, room, msg: message });
        setMessage("");
    };

    // Nouvelle fonction pour envoyer les symptômes
    const sendSymptoms = () => {
        if (!symptoms.trim()) {
            alert("Veuillez décrire les symptômes avant d'envoyer.");
            return;
        }
        
        const symptomMessage = `📋 DIAGNOSTIC: ${symptoms}`;
        socket.emit("chat_message", { username, room, msg: symptomMessage });
        setSymptoms(""); // Vider le champ après envoi
    };    

    return (
        <div className="p-8 max-w-4xl mx-auto min-h-screen bg-blue-50">
            <div className="bg-white p-8 rounded-lg mb-8 border-4 border-blue-400">
                <h1 className="text-2xl font-bold">👨‍⚕️ Interface Médecin</h1>
                <p>
                    <strong>Docteur:</strong> {username}
                </p>
                <p>
                    <strong>Room:</strong> {room}
                </p>
            </div>

            {/* Zone de description */}
            <div className="bg-white p-8 rounded-lg mb-8 border-4 border-blue-400">
                <h2 className="text-xl font-semibold mb-4">🧾 Maladies et Symptômes</h2>
                <div className="flex flex-wrap gap-2.5">
                    {Object.entries(maladies).map(([maladie, symptomes]) => (
                        <div
                            key={maladie}
                            className="flex-[0_0_48%] border border-gray-300 rounded-lg p-2.5 bg-blue-50 mb-2.5"
                        >
                            <strong>{maladie}</strong>
                            <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
                                {symptomes.map((symptome, i) => (
                                    <span
                                        key={i}
                                        className="flex-[0_0_48%] py-1.5 px-2 rounded-xl bg-green-100 text-sm text-center"
                                    >
                                        {symptome}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Zone de diagnostic */}
            <div className="bg-white p-6 rounded-lg mb-8">
                <h2 className="text-xl font-semibold mb-4">📋 Zone de Diagnostic</h2>
                <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Décrivez les symptômes du patient..."
                    className="w-full h-30 p-2.5 rounded border border-gray-300 resize-y"
                />
                <button 
                    onClick={sendSymptoms} 
                    className="mt-2.5 px-5 py-2.5 bg-green-600 text-white border-none rounded cursor-pointer hover:bg-green-700"
                >
                    📤 Envoyer au Pharmacien
                </button>
            </div>

            {/* Chat */}
            <div className="bg-white p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4">💬 Communication avec le Pharmacien</h3>

                <div className="border border-gray-300 h-50 overflow-y-auto p-2.5 mb-2.5 bg-gray-50">
                    {messages.map((msg, index) => (
                        <div key={index} className="mb-1.5">
                            {msg}
                        </div>
                    ))}
                </div>

                <div className="flex gap-2.5">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Écrivez votre message..."
                        className="flex-1 p-2.5 rounded border border-gray-300"
                    />
                    <button
                        onClick={sendMessage}
                        className="px-5 py-2.5 bg-blue-600 text-white border-none rounded cursor-pointer hover:bg-blue-700"
                    >
                        Envoyer
                    </button>
                </div>
            </div>
        </div>
    );
}