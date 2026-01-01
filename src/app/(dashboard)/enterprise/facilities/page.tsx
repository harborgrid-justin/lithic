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
  MapPin,
  Plus,
  Search,
  Building,
  Clock,
  Phone,
  Mail,
  Edit,
  Users,
} from "lucide-react";
import { Facility, FacilityStatus, FacilityType } from "@/types/enterprise";
import { FacilityManager } from "@/components/enterprise/FacilityManager";
import { useOrganization } from "@/hooks/useOrganization";
import toast from "react-hot-toast";

export default function FacilitiesPage() {
  const { organization } = useOrganization();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(
    null,
  );
  const [showFacilityManager, setShowFacilityManager] = useState(false);

  useEffect(() => {
    if (organization) {
      fetchFacilities();
    }
  }, [organization]);

  const fetchFacilities = async () => {
    if (!organization) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/enterprise/facilities?organizationId=${organization.id}`,
      );
      const data = await response.json();

      if (data.success) {
        setFacilities(data.data);
      } else {
        toast.error("Failed to fetch facilities");
      }
    } catch (error) {
      console.error("Error fetching facilities:", error);
      toast.error("Failed to fetch facilities");
    } finally {
      setLoading(false);
    }
  };

  const filteredFacilities = facilities.filter(
    (facility) =>
      facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      facility.facilityCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      facility.address.city.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusColor = (status: FacilityStatus) => {
    const colors = {
      [FacilityStatus.OPERATIONAL]: "bg-green-100 text-green-800",
      [FacilityStatus.UNDER_CONSTRUCTION]: "bg-yellow-100 text-yellow-800",
      [FacilityStatus.TEMPORARILY_CLOSED]: "bg-orange-100 text-orange-800",
      [FacilityStatus.PERMANENTLY_CLOSED]: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatFacilityType = (type: FacilityType) => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatOperatingHours = (facility: Facility) => {
    const today = new Date().getDay();
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const todayKey = days[today] as keyof typeof facility.operatingHours;
    const hours = facility.operatingHours[todayKey];

    if (!hours.open) return "Closed today";
    return `${hours.openTime} - ${hours.closeTime}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading facilities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Facility Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage facilities, locations, and operating hours
          </p>
        </div>
        <Button onClick={() => setShowFacilityManager(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Facility
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Facilities
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facilities.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Operational</CardTitle>
            <MapPin className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                facilities.filter(
                  (f) => f.status === FacilityStatus.OPERATIONAL,
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">Currently open</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Departments
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {facilities.reduce((sum, f) => sum + f.departments.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all facilities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Services</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {facilities.reduce((sum, f) => sum + f.services.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Service lines offered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search facilities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Facilities Display */}
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredFacilities.map((facility) => (
              <Card
                key={facility.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {facility.name}
                        <Badge className={getStatusColor(facility.status)}>
                          {facility.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {formatFacilityType(facility.type)} •{" "}
                        {facility.facilityCode}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFacility(facility);
                        setShowFacilityManager(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div>{facility.address.line1}</div>
                      {facility.address.line2 && (
                        <div>{facility.address.line2}</div>
                      )}
                      <div>
                        {facility.address.city}, {facility.address.state}{" "}
                        {facility.address.postalCode}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{facility.contactInfo.phone}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{facility.contactInfo.email}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatOperatingHours(facility)}</span>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Departments:
                      </span>
                      <span className="font-medium">
                        {facility.departments.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Services:</span>
                      <span className="font-medium">
                        {facility.services.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredFacilities.length === 0 && (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No facilities found
              </h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or add a new facility
              </p>
              <Button onClick={() => setShowFacilityManager(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Facility
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="map" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Map view integration coming soon
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Facility Manager Modal */}
      {showFacilityManager && (
        <FacilityManager
          facility={selectedFacility}
          onClose={() => {
            setShowFacilityManager(false);
            setSelectedFacility(null);
          }}
          onSave={() => {
            fetchFacilities();
            setShowFacilityManager(false);
            setSelectedFacility(null);
          }}
        />
      )}
    </div>
  );
}
