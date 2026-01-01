"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  FileText,
  Shield,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
} from "lucide-react";
import {
  DataSharingAgreement,
  AgreementStatus,
  AgreementType,
  DataType,
} from "@/types/enterprise";
import { DataSharingEditor } from "@/components/enterprise/DataSharingEditor";
import { useOrganization } from "@/hooks/useOrganization";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

export default function DataSharingPage() {
  const { organization } = useOrganization();
  const [agreements, setAgreements] = useState<DataSharingAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgreement, setSelectedAgreement] =
    useState<DataSharingAgreement | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (organization) {
      fetchAgreements();
    }
  }, [organization]);

  const fetchAgreements = async () => {
    if (!organization) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/enterprise/data-sharing?organizationId=${organization.id}`,
      );
      const data = await response.json();

      if (data.success) {
        setAgreements(data.data);
      } else {
        toast.error("Failed to fetch data sharing agreements");
      }
    } catch (error) {
      console.error("Error fetching agreements:", error);
      toast.error("Failed to fetch data sharing agreements");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: AgreementStatus) => {
    const colors = {
      [AgreementStatus.ACTIVE]: "bg-green-100 text-green-800",
      [AgreementStatus.DRAFT]: "bg-gray-100 text-gray-800",
      [AgreementStatus.PENDING_APPROVAL]: "bg-yellow-100 text-yellow-800",
      [AgreementStatus.SUSPENDED]: "bg-orange-100 text-orange-800",
      [AgreementStatus.EXPIRED]: "bg-red-100 text-red-800",
      [AgreementStatus.TERMINATED]: "bg-red-100 text-red-800",
      [AgreementStatus.UNDER_REVIEW]: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: AgreementStatus) => {
    switch (status) {
      case AgreementStatus.ACTIVE:
        return <CheckCircle className="h-4 w-4" />;
      case AgreementStatus.PENDING_APPROVAL:
      case AgreementStatus.UNDER_REVIEW:
        return <Clock className="h-4 w-4" />;
      case AgreementStatus.SUSPENDED:
      case AgreementStatus.EXPIRED:
      case AgreementStatus.TERMINATED:
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatAgreementType = (type: AgreementType) => {
    return type.replace(/_/g, " ");
  };

  const filteredAgreements = agreements.filter((agreement) => {
    const matchesSearch =
      agreement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agreement.type.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active")
      return matchesSearch && agreement.status === AgreementStatus.ACTIVE;
    if (activeTab === "pending")
      return (
        matchesSearch &&
        (agreement.status === AgreementStatus.PENDING_APPROVAL ||
          agreement.status === AgreementStatus.UNDER_REVIEW)
      );
    if (activeTab === "expired")
      return (
        matchesSearch &&
        (agreement.status === AgreementStatus.EXPIRED ||
          agreement.status === AgreementStatus.TERMINATED)
      );

    return matchesSearch;
  });

  const stats = {
    total: agreements.length,
    active: agreements.filter((a) => a.status === AgreementStatus.ACTIVE)
      .length,
    pending: agreements.filter(
      (a) =>
        a.status === AgreementStatus.PENDING_APPROVAL ||
        a.status === AgreementStatus.UNDER_REVIEW,
    ).length,
    expired: agreements.filter(
      (a) =>
        a.status === AgreementStatus.EXPIRED ||
        a.status === AgreementStatus.TERMINATED,
    ).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading agreements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Sharing Agreements</h1>
          <p className="text-muted-foreground mt-1">
            Manage inter-organizational data sharing and access controls
          </p>
        </div>
        <Button onClick={() => setShowEditor(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Agreement
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Agreements
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All agreements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently in effect
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Expired/Terminated
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expired}</div>
            <p className="text-xs text-muted-foreground mt-1">
              No longer active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search agreements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Agreements List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 gap-4">
            {filteredAgreements.map((agreement) => (
              <Card
                key={agreement.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {getStatusIcon(agreement.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">
                              {agreement.name}
                            </h3>
                            <Badge className={getStatusColor(agreement.status)}>
                              {agreement.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatAgreementType(agreement.type)} •{" "}
                            {agreement.purpose}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4 ml-14">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Partner Organization
                          </p>
                          <p className="text-sm mt-1">
                            {organization?.id === agreement.sourceOrganizationId
                              ? "Target: " + agreement.targetOrganizationId
                              : "Source: " + agreement.sourceOrganizationId}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Effective Date
                          </p>
                          <p className="text-sm mt-1">
                            {new Date(
                              agreement.effectiveDate,
                            ).toLocaleDateString()}
                            {agreement.expiryDate &&
                              ` - ${new Date(agreement.expiryDate).toLocaleDateString()}`}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Data Types
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {agreement.dataTypes.slice(0, 3).map((type) => (
                              <Badge
                                key={type}
                                variant="outline"
                                className="text-xs"
                              >
                                {type}
                              </Badge>
                            ))}
                            {agreement.dataTypes.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{agreement.dataTypes.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Compliance
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {agreement.complianceFramework.map((framework) => (
                              <Badge
                                key={framework}
                                variant="outline"
                                className="text-xs"
                              >
                                <Shield className="h-3 w-3 mr-1" />
                                {framework}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {agreement.expiryDate && (
                        <div className="mt-4 ml-14 p-3 bg-muted rounded-lg">
                          <p className="text-sm">
                            {agreement.status === AgreementStatus.EXPIRED ? (
                              <span className="text-red-600 font-medium">
                                Expired{" "}
                                {formatDistanceToNow(
                                  new Date(agreement.expiryDate),
                                )}{" "}
                                ago
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                Expires in{" "}
                                {formatDistanceToNow(
                                  new Date(agreement.expiryDate),
                                )}
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAgreement(agreement);
                          // Show details modal
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAgreement(agreement);
                          setShowEditor(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredAgreements.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No agreements found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === "all"
                    ? "Create your first data sharing agreement"
                    : `No ${activeTab} agreements`}
                </p>
                {activeTab === "all" && (
                  <Button onClick={() => setShowEditor(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Agreement
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Data Sharing Editor Modal */}
      {showEditor && (
        <DataSharingEditor
          agreement={selectedAgreement}
          onClose={() => {
            setShowEditor(false);
            setSelectedAgreement(null);
          }}
          onSave={() => {
            fetchAgreements();
            setShowEditor(false);
            setSelectedAgreement(null);
          }}
        />
      )}
    </div>
  );
}
