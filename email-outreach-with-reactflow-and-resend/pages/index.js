import Head from "next/head";
import { useState, useCallback, useMemo, useEffect } from "react";
import ReactFlow, {
	useNodesState,
	useEdgesState,
	getIncomers,
	getOutgoers,
	addEdge,
	getConnectedEdges,
} from "reactflow";
import "reactflow/dist/style.css";
import Task from "../components/Task";
import { useSelector } from "react-redux";

export default function Home() {
	const initialNodes = useSelector((state) => state.nodes.nodes);
	const initialEdges = useSelector((state) => state.nodes.edges);
	const [email, setEmail] = useState("");
	const [subject, setSubject] = useState("");
	const nodeTypes = useMemo(() => ({ task: Task }), []);
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	useEffect(() => {
		setNodes(initialNodes);
		setEdges(initialEdges);
	}, [initialNodes, setNodes, initialEdges, setEdges]);
	const onConnect = useCallback(
		(params) => setEdges((eds) => addEdge(params, eds)),
		[setEdges]
	);

	const onNodesDelete = useCallback(
		(deleted) => {
			setEdges(
				deleted.reduce((acc, node) => {
					const incomers = getIncomers(node, nodes, edges);
					const outgoers = getOutgoers(node, nodes, edges);
					const connectedEdges = getConnectedEdges([node], edges);

					const remainingEdges = acc.filter(
						(edge) => !connectedEdges.includes(edge)
					);

					const createdEdges = incomers.flatMap(({ id: source }) =>
						outgoers.map(({ id: target }) => ({
							id: `${source}->${target}`,
							source,
							target,
						}))
					);

					return [...remainingEdges, ...createdEdges];
				}, edges)
			);
		},
		[nodes, edges, setEdges]
	);

	const handleSubmit = (e) => {
		e.preventDefault();
		sendAtIntervals();
		setEmail("");
		setSubject("");
	};

	const sendAtIntervals = () => {
		let index = 0;
		// const interval = 1800000; // 30 minutes in milliseconds
		const interval = 3000;

		const logNextValue = () => {
			if (index < nodes.length) {
				sendEmail(index);
				index++;
				setTimeout(logNextValue, interval);
			}
		};
		logNextValue();
	};

	const sendEmail = (index) => {
		fetch("/api/send", {
			method: "POST",
			body: JSON.stringify({
				email,
				subject,
				task: nodes[index].data.value,
			}),
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then((data) => {
				alert(`Message ${index + 1} delivered!`);
			})
			.catch((err) => {
				alert(`Encountered an error when message${index} ❌`);
				console.error(err);
			});
	};

	return (
		<>
			<Head>
				<title>Email Outreach - Resend & ReactFlow</title>
				<meta name='description' content='Generated by create next app' />
				<meta name='viewport' content='width=device-width, initial-scale=1' />
				<link rel='icon' href='/favicon.ico' />
			</Head>
			<main className='main'>
				<header className='header'>
					<h1 style={{ marginBottom: "15px" }}>
						Email Outreach with ReactFlow and Resend
					</h1>
				</header>

				<form className='form' onSubmit={handleSubmit}>
					<label htmlFor='email'>Email</label>
					<input
						type='email'
						name='email'
						id='email'
						className='input'
						value={email}
						required
						onChange={(e) => setEmail(e.target.value)}
					/>

					<label htmlFor='subject'>Subject</label>
					<input
						type='text'
						name='subject'
						id='subject'
						className='input'
						value={subject}
						required
						onChange={(e) => setSubject(e.target.value)}
					/>
					<div style={{ height: "60vh", width: "100%", marginTop: "20px" }}>
						<ReactFlow
							nodes={nodes}
							edges={edges}
							onNodesChange={onNodesChange}
							onNodesDelete={onNodesDelete}
							onEdgesChange={onEdgesChange}
							onConnect={onConnect}
							nodeTypes={nodeTypes}
						/>
					</div>
					<button className='submitBtn'>START AUTOMATION</button>
				</form>
			</main>
		</>
	);
}
