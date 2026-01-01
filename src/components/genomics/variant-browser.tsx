'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Search, Filter } from 'lucide-react';

interface Variant {
  variantId: string;
  gene?: string;
  chromosome: string;
  position: number;
  reference: string;
  alternate: string;
  classification?: string;
  clinicalSignificance?: string;
  populationFrequency?: number;
  functionalImpact?: string;
}

interface VariantBrowserProps {
  variants: Variant[];
  loading?: boolean;
}

export function VariantBrowser({ variants, loading = false }: VariantBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClassification, setFilterClassification] = useState<string>('all');
  const [filterSignificance, setFilterSignificance] = useState<string>('all');
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  // Filter and search variants
  const filteredVariants = useMemo(() => {
    return variants.filter((variant) => {
      const matchesSearch =
        !searchTerm ||
        variant.variantId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        variant.gene?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        variant.chromosome.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesClassification =
        filterClassification === 'all' ||
        variant.classification === filterClassification;

      const matchesSignificance =
        filterSignificance === 'all' ||
        variant.clinicalSignificance === filterSignificance;

      return matchesSearch && matchesClassification && matchesSignificance;
    });
  }, [variants, searchTerm, filterClassification, filterSignificance]);

  const getClassificationBadge = (classification?: string) => {
    if (!classification) return null;

    const styles: Record<string, string> = {
      pathogenic: 'bg-red-100 text-red-800 border-red-300',
      likely_pathogenic: 'bg-orange-100 text-orange-800 border-orange-300',
      uncertain_significance: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      likely_benign: 'bg-green-100 text-green-800 border-green-300',
      benign: 'bg-blue-100 text-blue-800 border-blue-300',
    };

    return (
      <Badge className={styles[classification] || 'bg-gray-100 text-gray-800'}>
        {classification.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getImpactBadge = (impact?: string) => {
    if (!impact) return null;

    const styles: Record<string, string> = {
      high: 'bg-red-100 text-red-800',
      moderate: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
      modifier: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge variant="outline" className={styles[impact] || ''}>
        {impact}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Loading variants...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Variant Browser</CardTitle>
          <CardDescription>
            Browse and filter {variants.length} genomic variants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search gene, variant, or chromosome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterClassification} onValueChange={setFilterClassification}>
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="ACMG Classification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classifications</SelectItem>
                <SelectItem value="pathogenic">Pathogenic</SelectItem>
                <SelectItem value="likely_pathogenic">Likely Pathogenic</SelectItem>
                <SelectItem value="uncertain_significance">VUS</SelectItem>
                <SelectItem value="likely_benign">Likely Benign</SelectItem>
                <SelectItem value="benign">Benign</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSignificance} onValueChange={setFilterSignificance}>
              <SelectTrigger>
                <SelectValue placeholder="Clinical Significance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Significance</SelectItem>
                <SelectItem value="pathogenic">Pathogenic</SelectItem>
                <SelectItem value="likely_pathogenic">Likely Pathogenic</SelectItem>
                <SelectItem value="uncertain_significance">Uncertain</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredVariants.length} of {variants.length} variants
          </div>

          {/* Variants table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gene</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Frequency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVariants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No variants found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVariants.slice(0, 100).map((variant) => (
                    <TableRow
                      key={variant.variantId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedVariant(variant)}
                    >
                      <TableCell className="font-medium">{variant.gene || '-'}</TableCell>
                      <TableCell className="font-mono text-sm">
                        chr{variant.chromosome}:{variant.position}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {variant.reference} → {variant.alternate}
                      </TableCell>
                      <TableCell>{getClassificationBadge(variant.classification)}</TableCell>
                      <TableCell>{getImpactBadge(variant.functionalImpact)}</TableCell>
                      <TableCell>
                        {variant.populationFrequency
                          ? `${(variant.populationFrequency * 100).toFixed(4)}%`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredVariants.length > 100 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Showing first 100 variants. Use filters to narrow your search.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Variant details panel */}
      {selectedVariant && (
        <Card>
          <CardHeader>
            <CardTitle>Variant Details</CardTitle>
            <CardDescription>{selectedVariant.variantId}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Genomic Information</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Gene:</dt>
                    <dd className="font-medium">{selectedVariant.gene || 'Unknown'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Chromosome:</dt>
                    <dd className="font-mono">{selectedVariant.chromosome}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Position:</dt>
                    <dd className="font-mono">{selectedVariant.position}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Reference:</dt>
                    <dd className="font-mono">{selectedVariant.reference}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Alternate:</dt>
                    <dd className="font-mono">{selectedVariant.alternate}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Clinical Information</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Classification:</dt>
                    <dd>{getClassificationBadge(selectedVariant.classification)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Significance:</dt>
                    <dd>{selectedVariant.clinicalSignificance || 'Unknown'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Impact:</dt>
                    <dd>{getImpactBadge(selectedVariant.functionalImpact)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Population Freq:</dt>
                    <dd className="font-mono">
                      {selectedVariant.populationFrequency
                        ? `${(selectedVariant.populationFrequency * 100).toFixed(4)}%`
                        : 'Unknown'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
