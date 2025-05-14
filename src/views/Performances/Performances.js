import React, { useState, useEffect } from 'react';
import { Card, Select, DatePicker, Button, Row, Col, Alert, Spin, Table, Tag, Progress, Modal, Tabs, Statistic, message } from 'antd';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { getProjectsPerformance } from '../../services/performanceService';
import { FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import './Performances.css';

const { TabPane } = Tabs;

const Performances = () => {
    const [projectsPerformance, setProjectsPerformance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        projectId: null,
        dateRange: null
    });
    const [selectedProject, setSelectedProject] = useState(null);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

    // Charger les données de performance
    const fetchData = async (filterParams = {}) => {
        try {
            setLoading(true);
            const data = await getProjectsPerformance(filterParams);
            setProjectsPerformance(data);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load project performance data');
            console.error('Error loading project performance:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Appliquer les filtres
    const handleApplyFilters = () => {
        console.log('Applying filters:', filters);
        setLoading(true);

        // Vérifier si des filtres sont appliqués
        const hasProjectFilter = !!filters.projectId;
        const hasDateFilter = filters.dateRange && filters.dateRange.length === 2 && filters.dateRange[0] && filters.dateRange[1];

        // Vérifier que les dates sont valides si une plage de dates est sélectionnée
        if (hasDateFilter) {
            try {
                // Convertir les objets dayjs en objets Date si nécessaire
                const startDate = filters.dateRange[0].$d ? new Date(filters.dateRange[0].$d) : new Date(filters.dateRange[0]);
                const endDate = filters.dateRange[1].$d ? new Date(filters.dateRange[1].$d) : new Date(filters.dateRange[1]);

                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    message.error('Dates invalides');
                    setLoading(false);
                    return;
                }

                if (startDate > endDate) {
                    message.error('La date de début doit être antérieure à la date de fin');
                    setLoading(false);
                    return;
                }

                // Formater les dates pour l'affichage
                const formatDate = (date) => {
                    return date.toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                };

                const dateMessage = `Filtrage par période: du ${formatDate(startDate)} au ${formatDate(endDate)}`;
                message.info(dateMessage);
            } catch (error) {
                console.error('Erreur lors du traitement des dates:', error);
                message.error('Erreur lors du traitement des dates');
                setLoading(false);
                return;
            }
        }

        if (hasProjectFilter) {
            const projectName = projectsPerformance?.projects.find(p => p._id === filters.projectId)?.projectName || filters.projectId;
            message.info(`Filtrage par projet: ${projectName}`);
        }

        // Si aucun filtre n'est appliqué, informer l'utilisateur
        if (!hasProjectFilter && !hasDateFilter) {
            message.info('Aucun filtre appliqué, affichage de toutes les données');
        }

        fetchData(filters);
    };

    // Réinitialiser les filtres
    const handleResetFilters = () => {
        setFilters({
            projectId: null,
            dateRange: null
        });
        fetchData();
        message.success('Filtres réinitialisés');
    };



    // Afficher les détails d'un projet
    const showProjectDetails = async (project) => {
        try {
            // Afficher un message de chargement
            message.loading({ content: 'Chargement des détails du projet...', key: 'projectDetails' });

            // Récupérer les données complètes du projet depuis l'API
            const token = localStorage.getItem('token');
            if (!token) {
                message.error({ content: 'Erreur d\'authentification', key: 'projectDetails' });
                return;
            }

            // Récupérer les détails du projet
            const projectId = project._id;
            const projectResponse = await axios.get(`http://localhost:3001/api/projects/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!projectResponse.data || !projectResponse.data.project) {
                message.error({ content: 'Erreur lors de la récupération des détails du projet', key: 'projectDetails' });
                return;
            }

            const projectDetails = projectResponse.data.project;

            // Récupérer les tâches du projet
            const tasksResponse = await axios.get(`http://localhost:3001/api/tasks`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!tasksResponse.data || !tasksResponse.data.success || !tasksResponse.data.tasks) {
                message.error({ content: 'Erreur lors de la récupération des tâches', key: 'projectDetails' });
                return;
            }

            // Filtrer les tâches du projet
            const projectTasks = tasksResponse.data.tasks.filter(task => {
                if (!task.project) return false;

                // Gérer les différents formats possibles de l'ID du projet
                const taskProjectId = typeof task.project === 'object'
                    ? task.project._id || task.project.id
                    : task.project;

                return taskProjectId === projectId ||
                       taskProjectId.toString() === projectId.toString();
            });

            // Calculer les métriques de performance
            const now = new Date();

            // Compter les tâches par statut
            const totalTasks = projectTasks.length;
            const completedTasks = projectTasks.filter(task =>
                task.status === 'completed' ||
                task.status === 'done' ||
                task.status === 'terminé' ||
                task.status === 'terminée'
            ).length;

            const lateTasks = projectTasks.filter(task => {
                if (task.status !== 'completed' && task.status !== 'done' && task.dueDate) {
                    const dueDate = new Date(task.dueDate);
                    return dueDate < now;
                }
                return false;
            }).length;

            // Calculer le taux d'achèvement
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            // Calculer l'efficacité temporelle (basée sur les dates prévues vs réelles)
            let timeEfficiency = 100; // Valeur par défaut
            const tasksWithDates = projectTasks.filter(task =>
                (task.status === 'completed' || task.status === 'done') && task.dueDate && task.completedAt
            );

            if (tasksWithDates.length > 0) {
                const efficiencyScores = tasksWithDates.map(task => {
                    const dueDate = new Date(task.dueDate);
                    const completedAt = new Date(task.completedAt);
                    const diffDays = Math.floor((completedAt - dueDate) / (1000 * 60 * 60 * 24));

                    // Si la tâche est terminée avant la date prévue, l'efficacité est > 100%
                    // Si elle est terminée après, l'efficacité est < 100%
                    return diffDays <= 0 ? 100 + Math.min(Math.abs(diffDays) * 5, 50) : Math.max(100 - (diffDays * 10), 50);
                });

                timeEfficiency = Math.round(efficiencyScores.reduce((sum, score) => sum + score, 0) / efficiencyScores.length);
            }

            // Calculer le niveau de risque
            const lateTaskPercentage = totalTasks > 0 ? Math.round((lateTasks / totalTasks) * 100) : 0;

            // Niveau de risque basé sur le pourcentage de tâches en retard
            let riskLevel = 0;
            if (lateTaskPercentage >= 30) {
                riskLevel = 30; // Risque élevé
            } else if (lateTaskPercentage >= 15) {
                riskLevel = 20; // Risque moyen
            } else if (lateTaskPercentage > 0) {
                riskLevel = 10; // Risque faible
            }

            // Calculer l'utilisation des ressources
            let resourceUtilization = 85; // Valeur par défaut

            if (projectDetails.team && projectDetails.team.length > 0) {
                // Compter les tâches assignées à chaque membre de l'équipe
                const teamSize = projectDetails.team.length;
                const assignedTasksCount = projectTasks.filter(task => task.assignedTo && task.assignedTo.length > 0).length;

                // Calculer l'utilisation des ressources en fonction du ratio tâches/membres
                const idealTasksPerMember = totalTasks / teamSize;
                const actualTasksPerMember = assignedTasksCount / teamSize;

                // Normaliser entre 0 et 100
                resourceUtilization = Math.min(Math.round((actualTasksPerMember / idealTasksPerMember) * 100), 100);
            }

            // Créer l'objet de performance
            const performance = {
                completionRate,
                timeEfficiency,
                riskLevel,
                resourceUtilization,
                taskCount: totalTasks,
                completedTaskCount: completedTasks,
                lateTaskCount: lateTasks,
                tasks: projectTasks.map(task => ({
                    id: task._id || task.id,
                    title: task.title,
                    status: task.status,
                    dueDate: task.dueDate,
                    isLate: task.dueDate && new Date(task.dueDate) < now &&
                            task.status !== 'completed' && task.status !== 'done'
                }))
            };

            // Créer l'objet projet complet avec les performances
            const fullProject = {
                ...projectDetails,
                performance
            };

            // Mettre à jour l'état et afficher la modal
            setSelectedProject(fullProject);
            setIsDetailModalVisible(true);

            // Fermer le message de chargement avec succès
            message.success({ content: 'Détails du projet chargés', key: 'projectDetails', duration: 2 });

        } catch (error) {
            console.error('Erreur lors de la récupération des détails du projet:', error);
            message.error({
                content: `Erreur: ${error.message || 'Impossible de charger les détails du projet'}`,
                key: 'projectDetails'
            });

            // En cas d'erreur, utiliser les données de base fournies
            setSelectedProject(project);
            setIsDetailModalVisible(true);
        }
    };

    // Fermer la modal de détails
    const handleCloseDetailModal = () => {
        setIsDetailModalVisible(false);
    };

    // Couleurs pour les statuts
    const statusColors = {
        'completed': '#52c41a',  // vert
        'in-progress': '#1890ff', // bleu
        'delayed': '#faad14',    // orange
        'at-risk': '#f5222d'     // rouge
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" tip="Chargement des données de performance..." />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '20px' }}>
                <Alert
                    message="Erreur"
                    description={error}
                    type="error"
                    showIcon
                />
            </div>
        );
    }

    return (
        <div className="performance-dashboard">
            {/* En-tête */}
            <header style={{ marginBottom: '24px' }}>
                <Row align="middle" justify="center" style={{ marginBottom: '16px' }}>
                    <Col>
                        <h1 style={{ color: '#1890ff', margin: 0, fontSize: '28px', fontWeight: 'bold', textAlign: 'center' }}>
                            Tableau de Bord des Performances
                        </h1>
                    </Col>
                </Row>

                {/* Indicateur de filtres actifs */}
                {(filters.projectId || (filters.dateRange && filters.dateRange.length === 2 && filters.dateRange[0] && filters.dateRange[1])) && (
                    <div style={{ marginBottom: '16px' }}>
                        <Alert
                            message="Filtres actifs"
                            description={
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {filters.projectId && (
                                        <Tag color="blue" style={{ padding: '4px 8px', fontSize: '14px' }}>
                                            <strong>Projet:</strong> {projectsPerformance?.projects.find(p => p._id === filters.projectId)?.projectName || filters.projectId}
                                        </Tag>
                                    )}
                                    {filters.dateRange && filters.dateRange.length === 2 && filters.dateRange[0] && filters.dateRange[1] && (
                                        <Tag color="green" style={{ padding: '4px 8px', fontSize: '14px' }}>
                                            <strong>Période:</strong> {filters.dateRange[0].$d
                                                ? new Date(filters.dateRange[0].$d).toLocaleDateString('fr-FR')
                                                : new Date(filters.dateRange[0]).toLocaleDateString('fr-FR')
                                            } - {
                                                filters.dateRange[1].$d
                                                ? new Date(filters.dateRange[1].$d).toLocaleDateString('fr-FR')
                                                : new Date(filters.dateRange[1]).toLocaleDateString('fr-FR')
                                            }
                                        </Tag>
                                    )}
                                </div>
                            }
                            type="info"
                            showIcon
                            closable
                            onClose={handleResetFilters}
                        />
                    </div>
                )}

                <Card style={{ marginBottom: '16px' }}>
                    <Row gutter={16} align="middle">
                        <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                            <div style={{ marginBottom: '8px' }}>
                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Projet</label>
                                <Select
                                    placeholder="Sélectionner un projet"
                                    style={{ width: '100%' }}
                                    value={filters.projectId}
                                    onChange={(value) => setFilters(prev => ({ ...prev, projectId: value }))}
                                    allowClear
                                    options={projectsPerformance?.projects.map(project => ({
                                        value: project._id,
                                        label: project.projectName || `Projet ${project._id.substring(0, 5)}`
                                    })) || []}
                                />
                            </div>
                        </Col>
                        <Col xs={24} sm={24} md={10} lg={10} xl={10}>
                            <div style={{ marginBottom: '8px' }}>
                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Période</label>
                                <DatePicker.RangePicker
                                    style={{ width: '100%' }}
                                    value={filters.dateRange}
                                    onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
                                    placeholder={['Date de début', 'Date de fin']}
                                    format="DD/MM/YYYY"
                                    allowClear
                                    presets={[
                                        {
                                            label: 'Aujourd\'hui',
                                            value: [
                                                dayjs(new Date()),
                                                dayjs(new Date())
                                            ]
                                        },
                                        {
                                            label: 'Cette semaine',
                                            value: [
                                                dayjs(new Date(new Date().setDate(new Date().getDate() - new Date().getDay()))),
                                                dayjs(new Date(new Date().setDate(new Date().getDate() + (6 - new Date().getDay()))))
                                            ]
                                        },
                                        {
                                            label: 'Ce mois',
                                            value: [
                                                dayjs(new Date(new Date().setDate(1))),
                                                dayjs(new Date(new Date(new Date().setMonth(new Date().getMonth() + 1)).setDate(0)))
                                            ]
                                        },
                                        {
                                            label: 'Cette année',
                                            value: [
                                                dayjs(new Date(new Date().getFullYear(), 0, 1)),
                                                dayjs(new Date(new Date().getFullYear(), 11, 31))
                                            ]
                                        }
                                    ]}
                                />
                            </div>
                        </Col>
                        <Col xs={24} sm={24} md={6} lg={6} xl={6} style={{ textAlign: 'right' }}>
                            <Button
                                type="primary"
                                icon={<FilterOutlined />}
                                style={{ marginRight: '8px' }}
                                onClick={handleApplyFilters}
                            >
                                Appliquer
                            </Button>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={handleResetFilters}
                            >
                                Réinitialiser
                            </Button>
                        </Col>
                    </Row>
                </Card>
            </header>

            {/* Section 1 : Vue Globale */}
            <section style={{ marginBottom: '24px' }}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                        <Card
                            className="card-shadow"
                            style={{
                                height: '100%'
                            }}
                        >
                            <Statistic
                                title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>Taux d'avancement</span>}
                                value={projectsPerformance && projectsPerformance.kpis ? projectsPerformance.kpis.averageCompletionRate : 0}
                                suffix="%"
                                valueStyle={{
                                    color: '#1890ff',
                                    fontSize: '28px',
                                    fontWeight: 'bold'
                                }}
                                prefix={<Progress
                                    type="circle"
                                    percent={projectsPerformance?.kpis?.averageCompletionRate || 0}
                                    size="small"
                                    format={() => ''}
                                    style={{ marginRight: '16px' }}
                                />}
                                loading={!projectsPerformance || !projectsPerformance.kpis}
                            />
                            <div style={{ marginTop: '8px', fontSize: '14px', color: '#8c8c8c' }}>
                                Progression globale des projets
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                        <Card
                            className="card-shadow"
                            style={{
                                height: '100%'
                            }}
                        >
                            <Statistic
                                title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>Efficacité temporelle</span>}
                                value={projectsPerformance && projectsPerformance.kpis ? projectsPerformance.kpis.averageTimeEfficiency : 0}
                                suffix="%"
                                valueStyle={{
                                    color: '#52c41a',
                                    fontSize: '28px',
                                    fontWeight: 'bold'
                                }}
                                prefix={<Progress
                                    type="circle"
                                    percent={projectsPerformance?.kpis?.averageTimeEfficiency || 0}
                                    size="small"
                                    format={() => ''}
                                    strokeColor="#52c41a"
                                    style={{ marginRight: '16px' }}
                                />}
                                loading={!projectsPerformance || !projectsPerformance.kpis}
                            />
                            <div style={{ marginTop: '8px', fontSize: '14px', color: '#8c8c8c' }}>
                                Respect des délais prévus
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                        <Card
                            className="card-shadow"
                            style={{
                                height: '100%'
                            }}
                        >
                            <Statistic
                                title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>Projets à risque</span>}
                                value={projectsPerformance && projectsPerformance.kpis ? projectsPerformance.kpis.projectsAtRisk : 0}
                                valueStyle={{
                                    color: '#f5222d',
                                    fontSize: '28px',
                                    fontWeight: 'bold'
                                }}
                                prefix={<div
                                    style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '25px',
                                        backgroundColor: '#fff1f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: '16px'
                                    }}
                                >
                                    <span style={{ color: '#f5222d', fontSize: '24px' }}>⚠️</span>
                                </div>}
                                loading={!projectsPerformance || !projectsPerformance.kpis}
                            />
                            <div style={{ marginTop: '8px', fontSize: '14px', color: '#8c8c8c' }}>
                                Projets nécessitant attention
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                        <Card
                            className="card-shadow"
                            style={{
                                height: '100%'
                            }}
                        >
                            <Statistic
                                title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>Risques détectés</span>}
                                value={projectsPerformance && projectsPerformance.kpis ? projectsPerformance.kpis.totalRisks : 0}
                                valueStyle={{
                                    color: '#fa8c16',
                                    fontSize: '28px',
                                    fontWeight: 'bold'
                                }}
                                prefix={<div
                                    style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '25px',
                                        backgroundColor: '#fff7e6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: '16px'
                                    }}
                                >
                                    <span style={{ color: '#fa8c16', fontSize: '24px' }}>🔍</span>
                                </div>}
                                loading={!projectsPerformance || !projectsPerformance.kpis}
                            />
                            <div style={{ marginTop: '8px', fontSize: '14px', color: '#8c8c8c' }}>
                                Tâches en retard identifiées
                            </div>
                        </Card>
                    </Col>
                </Row>
            </section>

            {/* Section 2 : Graphiques */}
            <section style={{ marginBottom: '24px' }}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={24} lg={12} xl={12}>
                        <Card
                            title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>Performance des projets</span>}
                            style={{
                                height: '100%',
                                borderRadius: '8px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)'
                            }}
                            extra={
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
                                        <div style={{ width: '12px', height: '12px', backgroundColor: '#1890ff', marginRight: '4px', borderRadius: '2px' }}></div>
                                        <span style={{ fontSize: '12px' }}>Achèvement</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
                                        <div style={{ width: '12px', height: '12px', backgroundColor: '#52c41a', marginRight: '4px', borderRadius: '2px' }}></div>
                                        <span style={{ fontSize: '12px' }}>Efficacité</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <div style={{ width: '12px', height: '12px', backgroundColor: '#f5222d', marginRight: '4px', borderRadius: '2px' }}></div>
                                        <span style={{ fontSize: '12px' }}>Risque</span>
                                    </div>
                                </div>
                            }
                        >
                            <div style={{ height: '350px', position: 'relative' }}>
                                {projectsPerformance && projectsPerformance.charts && projectsPerformance.charts.performanceChartData && projectsPerformance.charts.performanceChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={projectsPerformance.charts.performanceChartData}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fontSize: 12 }}
                                                angle={-45}
                                                textAnchor="end"
                                                height={60}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 12 }}
                                                domain={[0, 100]}
                                                tickFormatter={(value) => `${value}%`}
                                            />
                                            <Tooltip
                                                formatter={(value) => [`${value}%`, '']}
                                                labelStyle={{ fontWeight: 'bold' }}
                                                contentStyle={{
                                                    borderRadius: '4px',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                                    border: 'none'
                                                }}
                                            />
                                            <Bar
                                                dataKey="completion"
                                                fill="#1890ff"
                                                name="Taux d'achèvement"
                                                radius={[4, 4, 0, 0]}
                                                barSize={20}
                                            />
                                            <Bar
                                                dataKey="efficiency"
                                                fill="#52c41a"
                                                name="Efficacité temporelle"
                                                radius={[4, 4, 0, 0]}
                                                barSize={20}
                                            />
                                            <Bar
                                                dataKey="risk"
                                                fill="#f5222d"
                                                name="Niveau de risque"
                                                radius={[4, 4, 0, 0]}
                                                barSize={20}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        height: '100%',
                                        flexDirection: 'column',
                                        backgroundColor: '#fafafa',
                                        borderRadius: '8px'
                                    }}>
                                        <span style={{ fontSize: '24px', marginBottom: '8px' }}>📊</span>
                                        <p style={{ color: '#8c8c8c' }}>Aucune donnée disponible</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} md={24} lg={12} xl={12}>
                        <Card
                            title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>Répartition des statuts de projets</span>}
                            style={{
                                height: '100%',
                                borderRadius: '8px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)'
                            }}
                        >
                            <div style={{ height: '350px', position: 'relative' }}>
                                {projectsPerformance && projectsPerformance.charts && projectsPerformance.charts.statusDistribution ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Terminés', value: projectsPerformance.charts.statusDistribution.completed, color: statusColors['completed'] },
                                                    { name: 'En cours', value: projectsPerformance.charts.statusDistribution.inProgress, color: statusColors['in-progress'] },
                                                    { name: 'En retard', value: projectsPerformance.charts.statusDistribution.delayed, color: statusColors['delayed'] },
                                                    { name: 'À risque', value: projectsPerformance.charts.statusDistribution.atRisk, color: statusColors['at-risk'] }
                                                ].filter(item => item.value > 0)} // Ne montrer que les statuts avec des valeurs
                                                cx="50%"
                                                cy="50%"
                                                labelLine={true}
                                                outerRadius={120}
                                                innerRadius={60}
                                                fill="#8884d8"
                                                dataKey="value"
                                                nameKey="name"
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                paddingAngle={2}
                                            >
                                                {[
                                                    { name: 'Terminés', value: projectsPerformance.charts.statusDistribution.completed, color: statusColors['completed'] },
                                                    { name: 'En cours', value: projectsPerformance.charts.statusDistribution.inProgress, color: statusColors['in-progress'] },
                                                    { name: 'En retard', value: projectsPerformance.charts.statusDistribution.delayed, color: statusColors['delayed'] },
                                                    { name: 'À risque', value: projectsPerformance.charts.statusDistribution.atRisk, color: statusColors['at-risk'] }
                                                ]
                                                .filter(item => item.value > 0) // Ne montrer que les statuts avec des valeurs
                                                .map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value, name) => [`${value} projet(s)`, name]}
                                                contentStyle={{
                                                    borderRadius: '4px',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                                    border: 'none'
                                                }}
                                            />
                                            <Legend
                                                layout="horizontal"
                                                verticalAlign="bottom"
                                                align="center"
                                                iconType="circle"
                                                iconSize={10}
                                                formatter={(value) => <span style={{ color: '#333', fontSize: '14px' }}>{value}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        height: '100%',
                                        flexDirection: 'column',
                                        backgroundColor: '#fafafa',
                                        borderRadius: '8px'
                                    }}>
                                        <span style={{ fontSize: '24px', marginBottom: '8px' }}>🥧</span>
                                        <p style={{ color: '#8c8c8c' }}>Aucune donnée disponible</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </Col>
                </Row>
            </section>

            {/* Section 3 : Analyse détaillée */}
            <section style={{ marginBottom: '24px' }}>
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Card
                            title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>Performance détaillée des projets</span>}
                            style={{
                                borderRadius: '8px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)'
                            }}
                            extra={
                                <div>
                                    {projectsPerformance && projectsPerformance.projects && projectsPerformance.projects.length > 0 && (
                                        <span style={{ color: '#8c8c8c', marginRight: '8px' }}>
                                            {projectsPerformance.projects.length} projet(s) trouvé(s)
                                        </span>
                                    )}
                                </div>
                            }
                        >
                            <Table
                                columns={[
                                    {
                                        title: 'Projet',
                                        dataIndex: 'name',
                                        key: 'name',
                                        sorter: (a, b) => a.name.localeCompare(b.name),
                                        render: (text) => <span style={{ fontWeight: 'bold' }}>{text}</span>
                                    },
                                    {
                                        title: 'Statut',
                                        dataIndex: 'status',
                                        key: 'status',
                                        filters: [
                                            { text: 'Terminé', value: 'completed' },
                                            { text: 'En cours', value: 'in-progress' },
                                            { text: 'En retard', value: 'delayed' },
                                            { text: 'À risque', value: 'at-risk' }
                                        ],
                                        onFilter: (value, record) => record.status === value,
                                        render: (status) => {
                                            let color = statusColors[status] || '#1890ff';
                                            let text = 'Inconnu';

                                            if (status === 'completed') text = 'Terminé';
                                            else if (status === 'in-progress') text = 'En cours';
                                            else if (status === 'delayed') text = 'En retard';
                                            else if (status === 'at-risk') text = 'À risque';

                                            return <Tag color={color} style={{ padding: '2px 8px', borderRadius: '4px' }}>{text}</Tag>;
                                        }
                                    },
                                    {
                                        title: 'Progression',
                                        dataIndex: 'completion',
                                        key: 'completion',
                                        sorter: (a, b) => a.completion - b.completion,
                                        render: (completion) => (
                                            <div style={{ width: '100%' }}>
                                                <Progress
                                                    percent={completion}
                                                    size="small"
                                                    strokeColor={{
                                                        '0%': '#108ee9',
                                                        '100%': '#87d068',
                                                    }}
                                                    style={{ marginRight: '8px' }}
                                                />
                                                <span style={{ fontSize: '12px', color: '#8c8c8c' }}>{completion}%</span>
                                            </div>
                                        )
                                    },
                                    {
                                        title: 'Efficacité',
                                        dataIndex: 'efficiency',
                                        key: 'efficiency',
                                        sorter: (a, b) => a.efficiency - b.efficiency,
                                        render: (efficiency) => {
                                            let color = '#52c41a';
                                            if (efficiency < 70) color = '#f5222d';
                                            else if (efficiency < 90) color = '#faad14';

                                            return (
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <div style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        backgroundColor: color,
                                                        marginRight: '8px'
                                                    }}></div>
                                                    <span style={{ fontWeight: 'bold', color }}>{efficiency}%</span>
                                                </div>
                                            );
                                        }
                                    },
                                    {
                                        title: 'Risque',
                                        dataIndex: 'risk',
                                        key: 'risk',
                                        sorter: (a, b) => a.risk - b.risk,
                                        render: (risk) => {
                                            let color = '#52c41a';
                                            let text = 'Faible';

                                            if (risk > 30) {
                                                color = '#f5222d';
                                                text = 'Élevé';
                                            } else if (risk > 10) {
                                                color = '#faad14';
                                                text = 'Moyen';
                                            }

                                            return (
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <Tag color={color} style={{ padding: '0px 8px', borderRadius: '10px' }}>
                                                        {text}
                                                    </Tag>
                                                    <span style={{ marginLeft: '4px', fontSize: '12px', color: '#8c8c8c' }}>
                                                        ({risk}%)
                                                    </span>
                                                </div>
                                            );
                                        }
                                    },
                                    {
                                        title: 'Actions',
                                        key: 'actions',
                                        render: (_, record) => (
                                            <Button
                                                type="primary"
                                                size="small"
                                                style={{ borderRadius: '4px' }}
                                                onClick={() => showProjectDetails({
                                                    _id: record.key
                                                })}
                                            >
                                                Détails
                                            </Button>
                                        )
                                    }
                                ]}
                                dataSource={projectsPerformance && projectsPerformance.projects ?
                                    projectsPerformance.projects.map(project => ({
                                        key: project._id,
                                        name: project.projectName || `Projet ${project._id.substring(0, 5)}`,
                                        status: project.performance.status,
                                        completion: project.performance.completionRate,
                                        efficiency: project.performance.timeEfficiency,
                                        risk: project.performance.riskLevel
                                    })) : []
                                }
                                pagination={{
                                    pageSize: 5,
                                    showSizeChanger: true,
                                    pageSizeOptions: ['5', '10', '20'],
                                    showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} projets`
                                }}
                                rowClassName={(record) => {
                                    if (record.status === 'at-risk') return 'table-row-risk';
                                    if (record.status === 'completed') return 'table-row-completed';
                                    return '';
                                }}
                                style={{ marginBottom: '16px' }}
                                loading={!projectsPerformance}
                            />
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Card
                            title={
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{ fontSize: '18px', fontWeight: 'bold', marginRight: '8px' }}>Recommandations IA</span>
                                    <Tag color="purple">Powered by AI</Tag>
                                </div>
                            }
                            style={{
                                borderRadius: '8px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)'
                            }}
                        >
                            {projectsPerformance && projectsPerformance.recommendations && projectsPerformance.recommendations.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {projectsPerformance.recommendations.map((recommendation, index) => {
                                        const iconMap = {
                                            'warning': '⚠️',
                                            'info': 'ℹ️',
                                            'success': '✅',
                                            'error': '❌'
                                        };

                                        return (
                                            <Alert
                                                key={`recommendation-${index}`}
                                                message={
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <span style={{ marginRight: '8px', fontSize: '18px' }}>
                                                            {iconMap[recommendation.type] || 'ℹ️'}
                                                        </span>
                                                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                                                            {recommendation.title}
                                                        </span>
                                                    </div>
                                                }
                                                description={
                                                    <div style={{ marginLeft: '26px', marginTop: '8px' }}>
                                                        {recommendation.description}
                                                    </div>
                                                }
                                                type={recommendation.type}
                                                showIcon={false}
                                                style={{
                                                    marginBottom: 10,
                                                    borderRadius: '8px',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '40px 20px',
                                    backgroundColor: '#fafafa',
                                    borderRadius: '8px',
                                    color: '#8c8c8c'
                                }}>
                                    <div style={{ fontSize: '24px', marginBottom: '16px' }}>🤖</div>
                                    <p style={{ fontSize: '16px', marginBottom: '8px' }}>Aucune recommandation disponible pour le moment</p>
                                    <p style={{ fontSize: '14px' }}>Les recommandations apparaîtront ici lorsque l'IA aura analysé suffisamment de données</p>
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>
            </section>

            {/* Modal de détails du projet */}
            <Modal
                title={
                    selectedProject ? (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                Détails du projet: {selectedProject.projectName}
                            </span>
                        </div>
                    ) : 'Détails du projet'
                }
                open={isDetailModalVisible}
                onCancel={handleCloseDetailModal}
                width={900}
                footer={[
                    <Button
                        key="close"
                        onClick={handleCloseDetailModal}
                        size="large"
                        style={{ borderRadius: '4px' }}
                    >
                        Fermer
                    </Button>
                ]}
                style={{ top: 20 }}
                className="detail-modal"
            >
                {selectedProject && (
                    <Tabs
                        defaultActiveKey="1"
                        type="card"
                        size="large"
                        style={{ marginTop: '8px' }}
                    >
                        <TabPane tab="Informations générales" key="1">
                            <div style={{ padding: '16px 0' }}>
                                <Row gutter={[24, 24]}>
                                    <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                                        <Card
                                            className="card-shadow"
                                            style={{
                                                height: '100%'
                                            }}
                                        >
                                            <Statistic
                                                title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>Taux d'achèvement</span>}
                                                value={selectedProject.performance.completionRate}
                                                suffix="%"
                                                valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}
                                                prefix={<Progress
                                                    type="circle"
                                                    percent={selectedProject.performance.completionRate}
                                                    size="small"
                                                    format={() => ''}
                                                    style={{ marginRight: '16px' }}
                                                />}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                                        <Card
                                            className="card-shadow"
                                            style={{
                                                height: '100%'
                                            }}
                                        >
                                            <Statistic
                                                title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>Efficacité temporelle</span>}
                                                value={selectedProject.performance.timeEfficiency}
                                                suffix="%"
                                                valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
                                                prefix={<Progress
                                                    type="circle"
                                                    percent={selectedProject.performance.timeEfficiency}
                                                    size="small"
                                                    format={() => ''}
                                                    strokeColor="#52c41a"
                                                    style={{ marginRight: '16px' }}
                                                />}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                                        <Card
                                            className="card-shadow"
                                            style={{
                                                height: '100%'
                                            }}
                                        >
                                            <Statistic
                                                title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>Niveau de risque</span>}
                                                value={selectedProject.performance.riskLevel}
                                                suffix="%"
                                                valueStyle={{ color: '#f5222d', fontSize: '24px', fontWeight: 'bold' }}
                                                prefix={<div
                                                    style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        borderRadius: '25px',
                                                        backgroundColor: '#fff1f0',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        marginRight: '16px'
                                                    }}
                                                >
                                                    <span style={{ color: '#f5222d', fontSize: '24px' }}>⚠️</span>
                                                </div>}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={24} sm={12} md={12} lg={6} xl={6}>
                                        <Card
                                            className="card-shadow"
                                            style={{
                                                height: '100%'
                                            }}
                                        >
                                            <Statistic
                                                title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>Utilisation des ressources</span>}
                                                value={selectedProject.performance.resourceUtilization}
                                                suffix="%"
                                                valueStyle={{ color: '#722ed1', fontSize: '24px', fontWeight: 'bold' }}
                                                prefix={<div
                                                    style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        borderRadius: '25px',
                                                        backgroundColor: '#f9f0ff',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        marginRight: '16px'
                                                    }}
                                                >
                                                    <span style={{ color: '#722ed1', fontSize: '24px' }}>📊</span>
                                                </div>}
                                            />
                                        </Card>
                                    </Col>
                                </Row>
                            </div>
                        </TabPane>
                        <TabPane tab="Tâches" key="2">
                            <div style={{ padding: '16px 0' }}>
                                <Row gutter={[24, 24]}>
                                    <Col xs={24} sm={8} md={8}>
                                        <Card
                                            className="card-shadow stat-card"
                                            style={{
                                                textAlign: 'center'
                                            }}
                                        >
                                            <Statistic
                                                title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>Total des tâches</span>}
                                                value={selectedProject.performance.taskCount}
                                                valueStyle={{ fontSize: '28px', fontWeight: 'bold' }}
                                            />
                                            <div style={{ marginTop: '8px', fontSize: '14px', color: '#8c8c8c' }}>
                                                Nombre total de tâches dans ce projet
                                            </div>
                                        </Card>
                                    </Col>
                                    <Col xs={24} sm={8} md={8}>
                                        <Card
                                            className="card-shadow stat-card"
                                            style={{
                                                textAlign: 'center'
                                            }}
                                        >
                                            <Statistic
                                                title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>Tâches terminées</span>}
                                                value={selectedProject.performance.completedTaskCount}
                                                valueStyle={{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold' }}
                                            />
                                            <div style={{ marginTop: '8px', fontSize: '14px', color: '#8c8c8c' }}>
                                                {Math.round((selectedProject.performance.completedTaskCount / selectedProject.performance.taskCount) * 100)}% des tâches sont terminées
                                            </div>
                                        </Card>
                                    </Col>
                                    <Col xs={24} sm={8} md={8}>
                                        <Card
                                            className="card-shadow stat-card"
                                            style={{
                                                textAlign: 'center'
                                            }}
                                        >
                                            <Statistic
                                                title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>Tâches en retard</span>}
                                                value={selectedProject.performance.lateTaskCount}
                                                valueStyle={{ color: '#f5222d', fontSize: '28px', fontWeight: 'bold' }}
                                            />
                                            <div style={{ marginTop: '8px', fontSize: '14px', color: '#8c8c8c' }}>
                                                {Math.round((selectedProject.performance.lateTaskCount / selectedProject.performance.taskCount) * 100)}% des tâches sont en retard
                                            </div>
                                        </Card>
                                    </Col>
                                </Row>
                                <div style={{ marginTop: '24px' }}>
                                    <Card
                                        title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>Progression des tâches</span>}
                                        className="card-shadow"
                                    >
                                        <Progress
                                            percent={selectedProject.performance.completionRate}
                                            status={selectedProject.performance.completionRate === 100 ? 'success' : 'active'}
                                            strokeColor={{
                                                '0%': '#108ee9',
                                                '100%': '#87d068',
                                            }}
                                            strokeWidth={15}
                                            style={{ marginBottom: '16px' }}
                                        />
                                        <Row gutter={16}>
                                            <Col span={8}>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <div style={{ width: '12px', height: '12px', backgroundColor: '#108ee9', marginRight: '8px', borderRadius: '2px' }}></div>
                                                    <span>À faire: {selectedProject.performance.taskCount - selectedProject.performance.completedTaskCount - selectedProject.performance.lateTaskCount}</span>
                                                </div>
                                            </Col>
                                            <Col span={8}>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <div style={{ width: '12px', height: '12px', backgroundColor: '#87d068', marginRight: '8px', borderRadius: '2px' }}></div>
                                                    <span>Terminées: {selectedProject.performance.completedTaskCount}</span>
                                                </div>
                                            </Col>
                                            <Col span={8}>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <div style={{ width: '12px', height: '12px', backgroundColor: '#f5222d', marginRight: '8px', borderRadius: '2px' }}></div>
                                                    <span>En retard: {selectedProject.performance.lateTaskCount}</span>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card>
                                </div>

                                {/* Liste des tâches du projet */}
                                {selectedProject.performance && selectedProject.performance.tasks && selectedProject.performance.tasks.length > 0 && (
                                    <div style={{ marginTop: '24px' }}>
                                        <Card
                                            title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>Liste des tâches</span>}
                                            className="card-shadow"
                                        >
                                            <Table
                                                columns={[
                                                    {
                                                        title: 'Titre',
                                                        dataIndex: 'title',
                                                        key: 'title',
                                                        render: (text) => <span style={{ fontWeight: 'bold' }}>{text}</span>
                                                    },
                                                    {
                                                        title: 'Statut',
                                                        dataIndex: 'status',
                                                        key: 'status',
                                                        render: (status) => {
                                                            let color = '#1890ff';
                                                            let text = status || 'En cours';

                                                            if (status === 'completed' || status === 'done' || status === 'terminé' || status === 'terminée') {
                                                                color = '#52c41a';
                                                                text = 'Terminée';
                                                            } else if (status === 'late' || status === 'en retard') {
                                                                color = '#f5222d';
                                                                text = 'En retard';
                                                            }

                                                            return <Tag color={color} style={{ padding: '2px 8px', borderRadius: '4px' }}>{text}</Tag>;
                                                        }
                                                    },
                                                    {
                                                        title: 'Date d\'échéance',
                                                        dataIndex: 'dueDate',
                                                        key: 'dueDate',
                                                        render: (dueDate) => {
                                                            if (!dueDate) return <span style={{ color: '#8c8c8c' }}>Non définie</span>;

                                                            const date = new Date(dueDate);
                                                            const now = new Date();
                                                            const isLate = date < now;

                                                            return (
                                                                <span style={{ color: isLate ? '#f5222d' : 'inherit' }}>
                                                                    {date.toLocaleDateString('fr-FR')}
                                                                    {isLate && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#f5222d' }}>(en retard)</span>}
                                                                </span>
                                                            );
                                                        }
                                                    }
                                                ]}
                                                dataSource={selectedProject.performance.tasks.map((task, index) => ({
                                                    key: task.id || index,
                                                    title: task.title || `Tâche ${index + 1}`,
                                                    status: task.status,
                                                    dueDate: task.dueDate,
                                                    isLate: task.isLate
                                                }))}
                                                pagination={{
                                                    pageSize: 5,
                                                    showSizeChanger: true,
                                                    pageSizeOptions: ['5', '10', '20'],
                                                    showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} tâches`
                                                }}
                                                rowClassName={(record) => {
                                                    if (record.isLate) return 'table-row-risk';
                                                    if (record.status === 'completed' || record.status === 'done') return 'table-row-completed';
                                                    return '';
                                                }}
                                                style={{ marginBottom: '16px' }}
                                            />
                                        </Card>
                                    </div>
                                )}
                            </div>
                        </TabPane>
                        <TabPane tab="Analyse de performance" key="3">
                            <div style={{ padding: '16px 0' }}>
                                <Card
                                    className="card-shadow"
                                >
                                    <div style={{ height: '400px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart
                                                outerRadius={150}
                                                data={[
                                                    {
                                                        subject: 'Achèvement',
                                                        value: selectedProject.performance.completionRate || 0,
                                                        fullMark: 100
                                                    },
                                                    {
                                                        subject: 'Efficacité',
                                                        value: selectedProject.performance.timeEfficiency || 0,
                                                        fullMark: 100
                                                    },
                                                    {
                                                        subject: 'Ressources',
                                                        value: selectedProject.performance.resourceUtilization || 0,
                                                        fullMark: 100
                                                    },
                                                    {
                                                        subject: 'Qualité',
                                                        value: 100 - (selectedProject.performance.riskLevel || 0),
                                                        fullMark: 100
                                                    },
                                                    {
                                                        subject: 'Respect des délais',
                                                        value: selectedProject.performance.lateTaskCount > 0
                                                            ? Math.max(0, 100 - (selectedProject.performance.lateTaskCount / selectedProject.performance.taskCount * 100))
                                                            : 100,
                                                        fullMark: 100
                                                    }
                                                ]}
                                            >
                                                <PolarGrid stroke="#e8e8e8" />
                                                <PolarAngleAxis
                                                    dataKey="subject"
                                                    tick={{ fontSize: 14, fill: '#333' }}
                                                />
                                                <PolarRadiusAxis
                                                    angle={30}
                                                    domain={[0, 100]}
                                                    tick={{ fontSize: 12 }}
                                                    tickFormatter={(value) => `${value}%`}
                                                />
                                                <Radar
                                                    name="Performance"
                                                    dataKey="value"
                                                    stroke="#1890ff"
                                                    fill="#1890ff"
                                                    fillOpacity={0.6}
                                                    strokeWidth={2}
                                                />
                                                <Tooltip
                                                    formatter={(value) => [`${value}%`, '']}
                                                    labelStyle={{ fontWeight: 'bold' }}
                                                    contentStyle={{
                                                        borderRadius: '4px',
                                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                                        border: 'none'
                                                    }}
                                                />
                                                <Legend
                                                    iconType="circle"
                                                    iconSize={10}
                                                    formatter={(value) => <span style={{ color: '#333', fontSize: '14px' }}>{value}</span>}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div style={{ marginTop: '16px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '14px', color: '#8c8c8c' }}>
                                            Ce graphique radar montre les performances du projet dans 5 dimensions clés.
                                            Plus la surface colorée est grande, meilleure est la performance globale.
                                        </p>
                                    </div>
                                </Card>
                            </div>
                        </TabPane>
                    </Tabs>
                )}
            </Modal>
        </div>
    );
};

export default Performances;
